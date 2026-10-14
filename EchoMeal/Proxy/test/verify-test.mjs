// Drives the real worker fetch handler with Apple and Anthropic stubbed out.
// The JWT signing is NOT stubbed: it runs against a genuine P-256 PKCS#8 key,
// and the test verifies the resulting signature with Web Crypto.

import worker from "../worker.js";

// A throwaway P-256 keypair, generated fresh every run so nothing resembling a
// signing key is ever committed. The private half is fed to the worker exactly
// the way a real .p8 from App Store Connect would be; the public half is used
// at the bottom to prove the worker's JWT signature is genuine.
const keyPair = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"]
);

function toPem(der, label) {
  const body = Buffer.from(der).toString("base64").match(/.{1,64}/g).join("\n");
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----\n`;
}

const PEM = toPem(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey), "PRIVATE KEY");
const BUNDLE = "com.echochambermedia.echomeal";
const PRODUCT = "com.echochamber.mealtime.pro.monthly";

let appleCalls = [];
let anthropicCalls = 0;
let appleHandler = null;
// What the stubbed Anthropic last received, and what it answers with next. The
// purpose, clamp and refund tests read the first and set the other two.
let lastUpstreamBody = null;
let anthropicStatus = 200;
let anthropicBody = JSON.stringify({ content: [{ type: "text", text: "{}" }] });

const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const href = typeof url === "string" ? url : url.url;
  if (href.includes("anthropic.com")) {
    anthropicCalls++;
    lastUpstreamBody = JSON.parse(init.body);
    return new Response(anthropicBody, {
      status: anthropicStatus,
      headers: { "content-type": "application/json" },
    });
  }
  if (href.includes("itunes.apple.com")) {
    appleCalls.push({ href, auth: init.headers.authorization });
    return appleHandler(href, init);
  }
  return realFetch(url, init);
};

// A minimal in-memory stand-in for the KV binding.
function makeKV() {
  const store = new Map();
  // The expirationTtl each key was last written with, so the tests can check
  // that counters expire and a stale one cannot linger.
  const ttls = new Map();
  return {
    store,
    ttls,
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value, options) {
      store.set(key, value);
      ttls.set(key, options && options.expirationTtl);
    },
  };
}

function signedTransactionInfo(productId) {
  const payload = Buffer.from(JSON.stringify({ productId }))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.signature`;
}

function appleOk(txnId, { status = 1, productId = PRODUCT, bundleId = BUNDLE } = {}) {
  return new Response(
    JSON.stringify({
      environment: "Production",
      bundleId,
      data: [
        {
          subscriptionGroupIdentifier: "22310219",
          lastTransactions: [
            {
              originalTransactionId: txnId,
              status,
              signedTransactionInfo: signedTransactionInfo(productId),
            },
          ],
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

const appleNotFound = () =>
  new Response(JSON.stringify({ errorCode: 4040010 }), { status: 404 });

function baseEnv(overrides = {}) {
  return {
    ANTHROPIC_API_KEY: "test-anthropic-key",
    APP_TOKEN: "test-app-token",
    APPLE_PRIVATE_KEY: PEM,
    APPLE_KEY_ID: "TESTKEYID01",
    APPLE_ISSUER_ID: "00000000-0000-0000-0000-000000000000",
    SPEND_COUNTER: makeKV(),
    ...overrides,
  };
}

const GOOD_BODY = JSON.stringify({
  system: "you plan meals",
  messages: [{ role: "user", content: "plan my week" }],
});

function makeRequest(txnId, body = GOOD_BODY, token = "test-app-token") {
  const headers = { "content-type": "application/json" };
  if (token !== null) headers["x-app-token"] = token;
  if (txnId !== null) headers["x-txn-id"] = txnId;
  return new Request("https://relay.example/", { method: "POST", headers, body });
}

let passes = 0;
let failures = 0;

async function check(name, fn) {
  appleCalls = [];
  anthropicCalls = 0;
  lastUpstreamBody = null;
  anthropicStatus = 200;
  anthropicBody = JSON.stringify({ content: [{ type: "text", text: "{}" }] });
  try {
    await fn();
    passes++;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failures++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${error.message}`);
  }
}

function expect(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

console.log("\nApple subscription verification\n");

await check("a real active subscription is let through", async () => {
  appleHandler = () => appleOk("2000000111111111");
  const env = baseEnv();
  const response = await worker.fetch(makeRequest("2000000111111111"), env);
  expect(response.status, 200, "status");
  expect(anthropicCalls, 1, "anthropic calls");
  expect(env.SPEND_COUNTER.store.get("verify-2000000111111111"), "yes", "cached verdict");
});

await check("an invented transaction ID is refused with 401", async () => {
  appleHandler = () => appleNotFound();
  const env = baseEnv();
  const response = await worker.fetch(makeRequest("madeupid12345"), env);
  expect(response.status, 401, "status");
  expect(anthropicCalls, 0, "anthropic calls");
  expect(env.SPEND_COUNTER.store.get("verify-madeupid12345"), "no", "cached verdict");
  // Nothing was counted against a caller who never had an allowance.
  const wroteQuota = [...env.SPEND_COUNTER.store.keys()].some((k) => k.startsWith("sub-"));
  expect(wroteQuota, false, "wrote a monthly quota key");
});

await check("an expired subscription (status 2) is refused", async () => {
  appleHandler = () => appleOk("2000000222222222", { status: 2 });
  const response = await worker.fetch(makeRequest("2000000222222222"), baseEnv());
  expect(response.status, 401, "status");
  expect(anthropicCalls, 0, "anthropic calls");
});

await check("billing retry (status 3) is refused, grace period (status 4) is not", async () => {
  appleHandler = () => appleOk("2000000333333333", { status: 3 });
  expect((await worker.fetch(makeRequest("2000000333333333"), baseEnv())).status, 401, "retry status");
  appleHandler = () => appleOk("2000000444444444", { status: 4 });
  expect((await worker.fetch(makeRequest("2000000444444444"), baseEnv())).status, 200, "grace status");
});

await check("a revoked subscription (status 5) is refused", async () => {
  appleHandler = () => appleOk("2000000555555555", { status: 5 });
  expect((await worker.fetch(makeRequest("2000000555555555"), baseEnv())).status, 401, "status");
});

await check("a transaction for a different product is refused", async () => {
  appleHandler = () => appleOk("2000000666666666", { productId: "com.someone.else.yearly" });
  expect((await worker.fetch(makeRequest("2000000666666666"), baseEnv())).status, 401, "status");
});

await check("a transaction for a different app is refused", async () => {
  appleHandler = () => appleOk("2000000777777777", { bundleId: "com.attacker.app" });
  expect((await worker.fetch(makeRequest("2000000777777777"), baseEnv())).status, 401, "status");
});

await check("someone else's transaction ID in the response is not accepted", async () => {
  // Apple answers about a different original ID than the one asked for.
  appleHandler = () => appleOk("2000000999999999");
  expect((await worker.fetch(makeRequest("2000000888888888"), baseEnv())).status, 401, "status");
});

console.log("\nSandbox handling\n");

await check("production 404 falls through to sandbox when allowed", async () => {
  appleHandler = (href) =>
    href.includes("sandbox") ? appleOk("2000001000000000") : appleNotFound();
  const response = await worker.fetch(makeRequest("2000001000000000"), baseEnv());
  expect(response.status, 200, "status");
  expect(appleCalls.length, 2, "apple calls");
  expect(appleCalls[0].href.includes("sandbox"), false, "production asked first");
  expect(appleCalls[1].href.includes("sandbox"), true, "sandbox asked second");
});

await check("production 401 falls through to sandbox (app has no live IAP yet)", async () => {
  // Apple's real behaviour before the Paid Applications Agreement and an
  // approved product exist: production rejects the JWT, sandbox accepts it.
  appleHandler = (href) =>
    href.includes("sandbox")
      ? appleOk("2000001050000000")
      : new Response("", { status: 401 });
  const response = await worker.fetch(makeRequest("2000001050000000"), baseEnv());
  expect(response.status, 200, "status");
  expect(appleCalls.length, 2, "apple calls");
  expect(appleCalls[1].href.includes("sandbox"), true, "sandbox asked second");
});

await check("production 401 plus sandbox 404 refuses the caller", async () => {
  appleHandler = (href) =>
    href.includes("sandbox") ? appleNotFound() : new Response("", { status: 401 });
  const response = await worker.fetch(makeRequest("2000001060000000"), baseEnv());
  expect(response.status, 401, "status");
  expect(anthropicCalls, 0, "anthropic calls");
});

await check("a bad key, 401 in both environments, gives 502 and is not cached", async () => {
  appleHandler = () => new Response("", { status: 401 });
  const env = baseEnv();
  const response = await worker.fetch(makeRequest("2000001070000000"), env);
  expect(response.status, 502, "status");
  expect(appleCalls.length, 2, "apple calls");
  expect(env.SPEND_COUNTER.store.has("verify-2000001070000000"), false, "cached a fault");
  expect((await response.text()).includes("not a problem with your subscription"), true, "message");
});

await check("sandbox is not consulted when ALLOW_SANDBOX_SUBSCRIPTIONS is 0", async () => {
  appleHandler = (href) =>
    href.includes("sandbox") ? appleOk("2000001100000000") : appleNotFound();
  const env = baseEnv({ ALLOW_SANDBOX_SUBSCRIPTIONS: "0" });
  const response = await worker.fetch(makeRequest("2000001100000000"), env);
  expect(response.status, 401, "status");
  expect(appleCalls.length, 1, "apple calls");
});

console.log("\nFailing safe\n");

await check("missing Apple credentials refuse with 502, never 401", async () => {
  appleHandler = () => appleOk("2000001200000000");
  const env = baseEnv({ APPLE_PRIVATE_KEY: undefined });
  const response = await worker.fetch(makeRequest("2000001200000000"), env);
  expect(response.status, 502, "status");
  expect(appleCalls.length, 0, "apple calls");
  expect(anthropicCalls, 0, "anthropic calls");
  const text = await response.text();
  expect(text.includes("not a problem with your subscription"), true, "reassuring message");
});

await check("Apple returning 500 gives 502, not 401, and is not cached", async () => {
  appleHandler = () => new Response("upstream boom", { status: 500 });
  const env = baseEnv();
  const response = await worker.fetch(makeRequest("2000001300000000"), env);
  expect(response.status, 502, "status");
  expect(env.SPEND_COUNTER.store.has("verify-2000001300000000"), false, "cached a fault");
  expect((await response.text()).includes("not a problem with your subscription"), true, "message");
});

await check("a network failure reaching Apple gives 502", async () => {
  appleHandler = () => {
    throw new Error("connect ECONNREFUSED");
  };
  const response = await worker.fetch(makeRequest("2000001500000000"), baseEnv());
  expect(response.status, 502, "status");
});

console.log("\nCaching and ordering\n");

await check("a cached yes skips the call to Apple", async () => {
  appleHandler = () => appleOk("2000001600000000");
  const env = baseEnv();
  await worker.fetch(makeRequest("2000001600000000"), env);
  const firstCallCount = appleCalls.length;
  appleCalls = [];
  await worker.fetch(makeRequest("2000001600000000"), env);
  expect(firstCallCount, 1, "first request asked Apple");
  expect(appleCalls.length, 0, "second request asked Apple again");
});

await check("a cached no still refuses without asking Apple", async () => {
  appleHandler = () => appleNotFound();
  const env = baseEnv();
  await worker.fetch(makeRequest("2000001700000000"), env);
  appleCalls = [];
  const response = await worker.fetch(makeRequest("2000001700000000"), env);
  expect(response.status, 401, "status");
  expect(appleCalls.length, 0, "asked Apple again");
});

await check("a malformed body is rejected before Apple is ever called", async () => {
  appleHandler = () => appleOk("2000001800000000");
  const response = await worker.fetch(
    makeRequest("2000001800000000", "{not json"),
    baseEnv()
  );
  expect(response.status, 400, "status");
  expect(appleCalls.length, 0, "apple calls");
});

await check("a smuggled stream key is rejected before Apple is ever called", async () => {
  appleHandler = () => appleOk("2000001900000000");
  const body = JSON.stringify({
    stream: true,
    messages: [{ role: "user", content: "hi" }],
  });
  const response = await worker.fetch(makeRequest("2000001900000000", body), baseEnv());
  expect(response.status, 400, "status");
  expect(appleCalls.length, 0, "apple calls");
});

await check("a bad app token is rejected before Apple is ever called", async () => {
  appleHandler = () => appleOk("2000002000000000");
  const response = await worker.fetch(
    makeRequest("2000002000000000", GOOD_BODY, "wrong-token"),
    baseEnv()
  );
  expect(response.status, 401, "status");
  expect(appleCalls.length, 0, "apple calls");
});

console.log("\nThe signed JWT itself\n");

await check("the bearer token is a valid ES256 JWT with Apple's required claims", async () => {
  appleHandler = () => appleOk("2000002100000000");
  await worker.fetch(makeRequest("2000002100000000"), baseEnv());
  const auth = appleCalls[0].auth;
  expect(auth.startsWith("Bearer "), true, "bearer prefix");

  const jwt = auth.slice("Bearer ".length);
  const [headerB64, claimsB64, signatureB64] = jwt.split(".");
  expect(typeof signatureB64, "string", "has a signature segment");

  const decode = (segment) =>
    JSON.parse(Buffer.from(segment.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());

  const header = decode(headerB64);
  expect(header.alg, "ES256", "alg");
  expect(header.typ, "JWT", "typ");
  expect(header.kid, "TESTKEYID01", "kid");

  const claims = decode(claimsB64);
  expect(claims.aud, "appstoreconnect-v1", "aud");
  expect(claims.bid, BUNDLE, "bid");
  expect(claims.iss, "00000000-0000-0000-0000-000000000000", "iss");
  if (!(claims.exp > claims.iat)) throw new Error("exp is not after iat");
  if (claims.exp - claims.iat > 3600) throw new Error("token lives longer than Apple's hour");

  // The signature has to actually verify against the public half of the key.
  const publicKey = keyPair.publicKey;
  const signature = Buffer.from(
    signatureB64.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (signatureB64.length % 4)) % 4),
    "base64"
  );
  expect(signature.length, 64, "raw r||s signature length");
  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    signature,
    new TextEncoder().encode(`${headerB64}.${claimsB64}`)
  );
  expect(valid, true, "signature verifies");
});

await check("a PEM whose newlines were escaped still imports", async () => {
  appleHandler = () => appleOk("2000002200000000");
  const mangled = PEM.replace(/\n/g, "\\n");
  const response = await worker.fetch(makeRequest("2000002200000000"), baseEnv({ APPLE_PRIVATE_KEY: mangled }));
  expect(response.status, 200, "status");
});

console.log("\nPurpose, clamps and web search\n");

// Sends one request as a subscriber Apple will vouch for. `fields` is merged
// into a body that is otherwise valid. Returns { response, env }.
async function sendAs(txnId, fields = {}, envOverrides = {}) {
  appleHandler = () => appleOk(txnId);
  const env = baseEnv(envOverrides);
  const body = JSON.stringify({
    system: "you plan meals",
    messages: [{ role: "user", content: "plan my week" }],
    ...fields,
  });
  const response = await worker.fetch(makeRequest(txnId, body), env);
  return { response, env };
}

const PURPOSE_LIST = ["plan", "swap", "topup", "discovery", "import"];
const PLAN_SET = new Set(["plan", "swap"]);
const SEARCH_PURPOSES = new Set(["discovery", "import"]);
const MONTH = new Date().toISOString().slice(0, 7);
const keysWithPrefix = (env, prefix) =>
  [...env.SPEND_COUNTER.store.keys()].filter((k) => k.startsWith(prefix));

await check("a missing purpose is treated as plan and never forwarded", async () => {
  const { response, env } = await sendAs("3000000000000001");
  expect(response.status, 200, "status");
  expect("purpose" in lastUpstreamBody, false, "purpose forwarded upstream");
  expect(lastUpstreamBody.max_tokens, 16000, "default ceiling is the plan ceiling");
  expect(env.SPEND_COUNTER.store.get(`sub-3000000000000001-${MONTH}`), "1", "plan counter");
  expect(keysWithPrefix(env, "shelf-").length, 0, "shelf counter written for a plan");
});

await check("every valid purpose is accepted and none is forwarded", async () => {
  for (const purpose of PURPOSE_LIST) {
    const { response } = await sendAs("3000000000000002", { purpose });
    expect(response.status, 200, `${purpose} status`);
    expect("purpose" in lastUpstreamBody, false, `${purpose} forwarded upstream`);
    expect(Object.keys(lastUpstreamBody).sort().join(","),
      "max_tokens,messages,model,system,thinking", `${purpose} upstream keys`);
  }
});

await check("an invalid purpose is refused by name before Apple or Anthropic", async () => {
  for (const bad of ["Plan", "chat", "", "plan ", "topup;", 7, null, ["plan"], { a: 1 }, true]) {
    const { response } = await sendAs("3000000000000003", { purpose: bad });
    const text = await response.text();
    expect(response.status, 400, `status for ${JSON.stringify(bad)}`);
    expect(text.includes("Unsupported purpose"), true, `message for ${JSON.stringify(bad)}`);
    expect(text.includes("plan, swap, topup, discovery, or import"), true, "lists the choices");
    if (typeof bad === "string" && bad !== "") {
      expect(text.includes(bad.trim()), true, `names ${JSON.stringify(bad)}`);
    }
    expect(appleCalls.length, 0, "apple calls");
    expect(anthropicCalls, 0, "anthropic calls");
  }
});

await check("an over-long purpose is shortened in the refusal", async () => {
  const { response } = await sendAs("3000000000000004", { purpose: "x".repeat(500) });
  const text = await response.text();
  expect(response.status, 400, "status");
  expect(text.length < 200, true, "refusal stays short");
});

await check("webSearch on plan, swap and topup is refused with the reason", async () => {
  for (const purpose of ["plan", "swap", "topup"]) {
    const { response } = await sendAs("3000000000000005", { purpose, webSearch: true });
    const text = await response.text();
    expect(response.status, 400, `${purpose} status`);
    expect(text.includes("Web search is not available"), true, `${purpose} message`);
    expect(text.includes("two minute limit"), true, `${purpose} gives the reason`);
    expect(anthropicCalls, 0, `${purpose} anthropic calls`);
    expect(appleCalls.length, 0, `${purpose} apple calls`);
  }
});

await check("no purpose with webSearch true is read as discovery (build 12 trending call)", async () => {
  const { response, env } = await sendAs("3000000000000026", { webSearch: true, max_tokens: 1500 });
  expect(response.status, 200, "status");
  expect(lastUpstreamBody.tools[0].type, "web_search_20260209", "search tool attached");
  expect(lastUpstreamBody.max_tokens, 1500, "max_tokens kept");
  expect("purpose" in lastUpstreamBody, false, "purpose forwarded upstream");
  expect(env.SPEND_COUNTER.store.get(`shelf-3000000000000026-${MONTH}`), "1", "counted on shelf");
  expect(keysWithPrefix(env, "sub-").length, 0, "spent a plan");
  await sendAs("3000000000000026", { webSearch: true, max_tokens: 900000 });
  expect(lastUpstreamBody.max_tokens, 4000, "discovery ceiling");
});

await check("no purpose and no webSearch stays plan, and webSearch false does too", async () => {
  for (const fields of [{}, { webSearch: false }]) {
    const { response, env } = await sendAs("3000000000000027", fields);
    expect(response.status, 200, "status");
    expect("tools" in lastUpstreamBody, false, "tools");
    expect(lastUpstreamBody.max_tokens, 16000, "plan ceiling");
    expect(env.SPEND_COUNTER.store.get(`sub-3000000000000027-${MONTH}`), "1", "counted on plan");
    expect(keysWithPrefix(env, "shelf-").length, 0, "shelf written");
  }
});

await check("webSearch on discovery and import attaches the pinned search tool", async () => {
  for (const purpose of ["discovery", "import"]) {
    const { response } = await sendAs("3000000000000006", { purpose, webSearch: true });
    expect(response.status, 200, `${purpose} status`);
    expect(lastUpstreamBody.tools.length, 1, `${purpose} tool count`);
    expect(lastUpstreamBody.tools[0].type, "web_search_20260209", `${purpose} tool type`);
    expect(lastUpstreamBody.tools[0].max_uses, 4, `${purpose} max_uses`);
    expect("webSearch" in lastUpstreamBody, false, `${purpose} leaked webSearch`);
  }
});

await check("webSearch false is fine on any purpose and attaches nothing", async () => {
  for (const purpose of PURPOSE_LIST) {
    const { response } = await sendAs("3000000000000007", { purpose, webSearch: false });
    expect(response.status, 200, `${purpose} status`);
    expect("tools" in lastUpstreamBody, false, `${purpose} tools`);
  }
});

await check("max_tokens is clamped per purpose, and a missing one gets the ceiling", async () => {
  const ceilings = { plan: 16000, swap: 16000, topup: 12000, discovery: 4000, import: 4000 };
  for (const [purpose, ceiling] of Object.entries(ceilings)) {
    await sendAs("3000000000000008", { purpose, max_tokens: 900000 });
    expect(lastUpstreamBody.max_tokens, ceiling, `${purpose} over-ask`);
    await sendAs("3000000000000008", { purpose });
    expect(lastUpstreamBody.max_tokens, ceiling, `${purpose} missing`);
    await sendAs("3000000000000008", { purpose, max_tokens: 1500 });
    expect(lastUpstreamBody.max_tokens, 1500, `${purpose} under-ask is kept`);
    await sendAs("3000000000000008", { purpose, max_tokens: ceiling });
    expect(lastUpstreamBody.max_tokens, ceiling, `${purpose} exact ceiling`);
  }
});

await check("an old build's request shape still works unchanged", async () => {
  // Build 12 sends no purpose and asks for the old 16000 ceiling.
  const { response } = await sendAs("3000000000000009", { max_tokens: 16000 });
  expect(response.status, 200, "status");
  expect(lastUpstreamBody.max_tokens, 16000, "max_tokens");
  expect(lastUpstreamBody.model, "claude-sonnet-5", "model pin");
  expect(lastUpstreamBody.thinking.type, "disabled", "thinking pin");
});

console.log("\nCounters\n");

await check("plan and swap count on the sub- key, shelf purposes on the shelf- key", async () => {
  for (const purpose of ["plan", "swap"]) {
    const { env } = await sendAs("3000000000000010", { purpose });
    expect(env.SPEND_COUNTER.store.get(`sub-3000000000000010-${MONTH}`), "1", `${purpose} sub key`);
    expect(keysWithPrefix(env, "shelf-").length, 0, `${purpose} wrote a shelf key`);
    expect(env.SPEND_COUNTER.ttls.get(`sub-3000000000000010-${MONTH}`), 3456000, `${purpose} sub ttl`);
  }
  for (const purpose of ["topup", "discovery", "import"]) {
    const webSearch = purpose !== "topup";
    const { env } = await sendAs("3000000000000010", { purpose, webSearch });
    expect(env.SPEND_COUNTER.store.get(`shelf-3000000000000010-${MONTH}`), "1", `${purpose} shelf key`);
    expect(keysWithPrefix(env, "sub-").length, 0, `${purpose} wrote a sub key`);
    expect(env.SPEND_COUNTER.ttls.get(`shelf-3000000000000010-${MONTH}`), 3456000, `${purpose} shelf ttl`);
  }
});

await check("every purpose also counts on txn-<id>-<day> and requests-<day>, two day TTL", async () => {
  for (const purpose of PURPOSE_LIST) {
    const { env } = await sendAs("3000000000000011", { purpose, webSearch: SEARCH_PURPOSES.has(purpose) });
    const txnKeys = keysWithPrefix(env, "txn-3000000000000011-");
    expect(txnKeys.length, 1, `${purpose} txn key count`);
    if (!/^txn-3000000000000011-\d{4}-\d{2}-\d{2}$/.test(txnKeys[0])) {
      throw new Error(`${purpose}: txn key shape is ${txnKeys[0]}`);
    }
    expect(env.SPEND_COUNTER.store.get(txnKeys[0]), "1", `${purpose} txn count`);
    expect(env.SPEND_COUNTER.ttls.get(txnKeys[0]), 172800, `${purpose} txn ttl`);
    const globalKeys = keysWithPrefix(env, "requests-");
    expect(globalKeys.length, 1, `${purpose} global key count`);
    expect(env.SPEND_COUNTER.store.get(globalKeys[0]), "1", `${purpose} global count`);
    expect(env.SPEND_COUNTER.ttls.get(globalKeys[0]), 172800, `${purpose} global ttl`);
  }
});

await check("the plan quota stops at 20 and does not touch shelf requests", async () => {
  appleHandler = () => appleOk("3000000000000012");
  const env = baseEnv();
  env.SPEND_COUNTER.store.set(`sub-3000000000000012-${MONTH}`, "20");
  for (const purpose of ["plan", "swap"]) {
    const response = await worker.fetch(
      makeRequest("3000000000000012", JSON.stringify({ purpose, messages: [{ role: "user", content: "hi" }] })),
      env
    );
    expect(response.status, 402, `${purpose} status`);
    expect((await response.text()).includes("all 20 meal plans"), true, `${purpose} message`);
  }
  expect(anthropicCalls, 0, "anthropic calls while over quota");
  const shelf = await worker.fetch(
    makeRequest("3000000000000012", JSON.stringify({ purpose: "topup", messages: [{ role: "user", content: "hi" }] })),
    env
  );
  expect(shelf.status, 200, "topup still allowed");
});

await check("the shelf quota stops at 90 and does not touch plans", async () => {
  appleHandler = () => appleOk("3000000000000013");
  const env = baseEnv();
  env.SPEND_COUNTER.store.set(`shelf-3000000000000013-${MONTH}`, "90");
  for (const purpose of ["topup", "discovery", "import"]) {
    const response = await worker.fetch(
      makeRequest("3000000000000013", JSON.stringify({ purpose, messages: [{ role: "user", content: "hi" }] })),
      env
    );
    expect(response.status, 402, `${purpose} status`);
    expect((await response.text()).includes("all 90 recipe refreshes"), true, `${purpose} message`);
  }
  const plan = await worker.fetch(makeRequest("3000000000000013"), env);
  expect(plan.status, 200, "plan still allowed");
  // One under the cap goes through and lands exactly on the cap.
  env.SPEND_COUNTER.store.set(`shelf-3000000000000013-${MONTH}`, "89");
  const last = await worker.fetch(
    makeRequest("3000000000000013", JSON.stringify({ purpose: "topup", messages: [{ role: "user", content: "hi" }] })),
    env
  );
  expect(last.status, 200, "89th use passes");
  expect(env.SPEND_COUNTER.store.get(`shelf-3000000000000013-${MONTH}`), "90", "count after");
});

await check("MONTHLY_SHELF_CAP is read from the environment, and 0 pauses shelf requests only", async () => {
  appleHandler = () => appleOk("3000000000000014");
  const env = baseEnv({ MONTHLY_SHELF_CAP: "0" });
  const shelf = await worker.fetch(
    makeRequest("3000000000000014", JSON.stringify({ purpose: "topup", messages: [{ role: "user", content: "hi" }] })),
    env
  );
  expect(shelf.status, 402, "shelf status");
  expect((await shelf.text()).includes("paused"), true, "shelf paused message");
  expect((await worker.fetch(makeRequest("3000000000000014"), env)).status, 200, "plan unaffected");
});

await check("DAILY_TXN_CAP defaults to 25, is per transaction, and spans purposes", async () => {
  appleHandler = () => appleOk("3000000000000015");
  const env = baseEnv();
  const day = new Date().toISOString().slice(0, 10);
  env.SPEND_COUNTER.store.set(`txn-3000000000000015-${day}`, "24");
  expect((await worker.fetch(makeRequest("3000000000000015"), env)).status, 200, "25th request passes");
  expect(env.SPEND_COUNTER.store.get(`txn-3000000000000015-${day}`), "25", "count after");
  for (const purpose of PURPOSE_LIST) {
    const fields = { purpose, messages: [{ role: "user", content: "hi" }] };
    const response = await worker.fetch(makeRequest("3000000000000015", JSON.stringify(fields)), env);
    expect(response.status, 429, `${purpose} status at the cap`);
    expect((await response.text()).includes("This household"), true, `${purpose} message`);
  }
  // A different household is not affected.
  appleHandler = () => appleOk("3000000000000016");
  expect((await worker.fetch(makeRequest("3000000000000016"), env)).status, 200, "other household");
});

await check("DAILY_TXN_CAP is read from the environment", async () => {
  appleHandler = () => appleOk("3000000000000017");
  const env = baseEnv({ DAILY_TXN_CAP: "2" });
  expect((await worker.fetch(makeRequest("3000000000000017"), env)).status, 200, "first");
  expect((await worker.fetch(makeRequest("3000000000000017"), env)).status, 200, "second");
  expect((await worker.fetch(makeRequest("3000000000000017"), env)).status, 429, "third");
});

await check("the global daily cap defaults to 120 when the variable is missing", async () => {
  appleHandler = () => appleOk("3000000000000018");
  const env = baseEnv();
  const day = new Date().toISOString().slice(0, 10);
  env.SPEND_COUNTER.store.set(`requests-${day}`, "119");
  expect((await worker.fetch(makeRequest("3000000000000018"), env)).status, 200, "120th passes");
  expect(env.SPEND_COUNTER.store.get(`requests-${day}`), "120", "count after");
  const refused = await worker.fetch(makeRequest("3000000000000018"), env);
  expect(refused.status, 429, "121st refused");
  expect((await refused.text()).includes("daily planning limit"), true, "message");
});

await check("DAILY_REQUEST_CAP from the environment wins over the code default", async () => {
  appleHandler = () => appleOk("3000000000000019");
  const env = baseEnv({ DAILY_REQUEST_CAP: "1" });
  expect((await worker.fetch(makeRequest("3000000000000019"), env)).status, 200, "first");
  expect((await worker.fetch(makeRequest("3000000000000019"), env)).status, 429, "second");
});

await check("a refusal at the global cap leaves the earlier counters untouched", async () => {
  appleHandler = () => appleOk("3000000000000020");
  const env = baseEnv({ DAILY_REQUEST_CAP: "5" });
  const day = new Date().toISOString().slice(0, 10);
  env.SPEND_COUNTER.store.set(`requests-${day}`, "5");
  env.SPEND_COUNTER.store.set(`sub-3000000000000020-${MONTH}`, "3");
  env.SPEND_COUNTER.store.set(`txn-3000000000000020-${day}`, "4");
  const response = await worker.fetch(makeRequest("3000000000000020"), env);
  expect(response.status, 429, "status");
  expect(env.SPEND_COUNTER.store.get(`sub-3000000000000020-${MONTH}`), "3", "monthly leaked a count");
  expect(env.SPEND_COUNTER.store.get(`txn-3000000000000020-${day}`), "4", "txn daily leaked a count");
});

console.log("\nRefunds and logging\n");

await check("a failed upstream call refunds every counter it counted", async () => {
  const day = new Date().toISOString().slice(0, 10);
  for (const purpose of PURPOSE_LIST) {
    appleHandler = () => appleOk("3000000000000021");
    const env = baseEnv();
    const quotaKey = PLAN_SET.has(purpose)
      ? `sub-3000000000000021-${MONTH}`
      : `shelf-3000000000000021-${MONTH}`;
    const otherKey = PLAN_SET.has(purpose)
      ? `shelf-3000000000000021-${MONTH}`
      : `sub-3000000000000021-${MONTH}`;
    env.SPEND_COUNTER.store.set(quotaKey, "7");
    env.SPEND_COUNTER.store.set(`txn-3000000000000021-${day}`, "8");
    env.SPEND_COUNTER.store.set(`requests-${day}`, "9");
    anthropicStatus = 529;
    const body = JSON.stringify({
      purpose,
      webSearch: SEARCH_PURPOSES.has(purpose),
      messages: [{ role: "user", content: "hi" }],
    });
    const response = await worker.fetch(makeRequest("3000000000000021", body), env);
    expect(response.status, 529, `${purpose} status passes through`);
    expect(anthropicCalls, 1, `${purpose} reached upstream`);
    expect(env.SPEND_COUNTER.store.get(quotaKey), "7", `${purpose} quota refunded`);
    expect(env.SPEND_COUNTER.store.get(`txn-3000000000000021-${day}`), "8", `${purpose} txn refunded`);
    expect(env.SPEND_COUNTER.store.get(`requests-${day}`), "9", `${purpose} global refunded`);
    expect(env.SPEND_COUNTER.store.has(otherKey), false, `${purpose} touched the other quota`);
    anthropicCalls = 0;
  }
});

await check("an upstream 401 is remapped to 502, refunded, and its body is never logged", async () => {
  appleHandler = () => appleOk("3000000000000022");
  const env = baseEnv();
  const day = new Date().toISOString().slice(0, 10);
  anthropicStatus = 401;
  anthropicBody = JSON.stringify({ error: { message: "SECRET-UPSTREAM-TEXT household pantry" } });
  const logged = [];
  const realLog = console.log;
  console.log = (...args) => logged.push(args.join(" "));
  let response;
  try {
    response = await worker.fetch(makeRequest("3000000000000022"), env);
  } finally {
    console.log = realLog;
  }
  expect(response.status, 502, "status");
  const text = await response.text();
  expect(text.includes("SECRET-UPSTREAM-TEXT"), false, "body leaked to the client");
  expect(logged.some((line) => line.includes("401")), true, "status was logged");
  expect(logged.some((line) => line.includes("SECRET-UPSTREAM-TEXT")), false, "body was logged");
  expect(env.SPEND_COUNTER.store.get(`requests-${day}`), "0", "global refunded");
  expect(env.SPEND_COUNTER.store.get(`sub-3000000000000022-${MONTH}`), "0", "monthly refunded");
  expect(env.SPEND_COUNTER.store.get(`txn-3000000000000022-${day}`), "0", "txn refunded");
});

await check("a successful call keeps its counts", async () => {
  const { env } = await sendAs("3000000000000023", { purpose: "topup" });
  expect(env.SPEND_COUNTER.store.get(`shelf-3000000000000023-${MONTH}`), "1", "shelf");
});

console.log("\nBypass and failing open\n");

await check("with REQUIRE_SUBSCRIPTION=0 only the global counter is written", async () => {
  appleHandler = () => appleOk("3000000000000024");
  const env = baseEnv({ REQUIRE_SUBSCRIPTION: "0" });
  const response = await worker.fetch(makeRequest(null), env);
  expect(response.status, 200, "status");
  expect(appleCalls.length, 0, "apple calls");
  expect(keysWithPrefix(env, "requests-").length, 1, "global key");
  expect(keysWithPrefix(env, "sub-").length, 0, "sub key");
  expect(keysWithPrefix(env, "shelf-").length, 0, "shelf key");
  expect(keysWithPrefix(env, "txn-").length, 0, "txn key");
});

await check("purpose rules still apply while the bypass is on", async () => {
  const env = baseEnv({ REQUIRE_SUBSCRIPTION: "0" });
  const badPurpose = JSON.stringify({ purpose: "nope", messages: [{ role: "user", content: "hi" }] });
  expect((await worker.fetch(makeRequest(null, badPurpose), env)).status, 400, "bad purpose");
  const planSearch = JSON.stringify({ purpose: "plan", webSearch: true, messages: [{ role: "user", content: "hi" }] });
  expect((await worker.fetch(makeRequest(null, planSearch), env)).status, 400, "search on plan");
  const discovery = JSON.stringify({ purpose: "discovery", webSearch: true, max_tokens: 1500, messages: [{ role: "user", content: "hi" }] });
  expect((await worker.fetch(makeRequest(null, discovery), env)).status, 200, "discovery search");
  expect(lastUpstreamBody.max_tokens, 1500, "max_tokens");
});

await check("if KV is unavailable every counter fails open", async () => {
  appleHandler = () => appleOk("3000000000000025");
  const env = baseEnv();
  const broken = {
    async get() {
      throw new Error("KV down");
    },
    async put() {
      throw new Error("KV down");
    },
  };
  env.SPEND_COUNTER = broken;
  const response = await worker.fetch(makeRequest("3000000000000025"), env);
  expect(response.status, 200, "status");
  expect(anthropicCalls, 1, "anthropic calls");
});

console.log(`\n${passes} passed, ${failures} failed\n`);
process.exit(failures === 0 ? 0 : 1);
