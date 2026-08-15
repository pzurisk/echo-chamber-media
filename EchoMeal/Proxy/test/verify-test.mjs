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
const PRODUCT = "com.echochambermedia.echomeal.monthly";

let appleCalls = [];
let anthropicCalls = 0;
let appleHandler = null;

const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const href = typeof url === "string" ? url : url.url;
  if (href.includes("anthropic.com")) {
    anthropicCalls++;
    return new Response(JSON.stringify({ content: [{ type: "text", text: "{}" }] }), {
      status: 200,
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
  return {
    store,
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      store.set(key, value);
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
          subscriptionGroupIdentifier: "20983471",
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
    APPLE_KEY_ID: "XR632GR99D",
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
  expect(header.kid, "XR632GR99D", "kid");

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

console.log(`\n${passes} passed, ${failures} failed\n`);
process.exit(failures === 0 ? 0 : 1);
