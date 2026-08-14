// Smoke test for the three APPLE_ values before they go anywhere near a
// deploy. It signs a real JWT with the real key and asks Apple about a
// transaction ID that cannot exist, then reads the answer:
//
//   404  the credentials work. Apple authenticated the request and then said
//        it has never heard of that transaction, which is exactly right.
//   401  the credentials do not work. Wrong key, wrong Key ID, wrong Issuer
//        ID, or a Team Key where an In-App Purchase key was needed.
//
// Nothing is written anywhere and no secret is printed. The key never leaves
// this machine except as a signature inside the JWT, which is what Apple
// needs to verify it.
//
// Usage:
//   node test/check-apple-credentials.mjs \
//     --key ~/.appstoreconnect/private_keys/AuthKey_XXXXXXXXXX.p8 \
//     --key-id XXXXXXXXXX \
//     --issuer-id 00000000-0000-0000-0000-000000000000

import { readFileSync } from "node:fs";

const BUNDLE_ID = "com.echochambermedia.echomeal";
const HOSTS = [
  ["production", "https://api.storekit.itunes.apple.com"],
  ["sandbox", "https://api.storekit-sandbox.itunes.apple.com"],
];

// A syntactically valid transaction ID that Apple cannot have issued.
const PROBE_TRANSACTION_ID = "1";

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const keyPath = arg("key");
const keyId = arg("key-id");
const issuerId = arg("issuer-id");

if (!keyPath || !keyId || !issuerId) {
  console.error("Need --key, --key-id, and --issuer-id. See the top of this file.");
  process.exit(2);
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

let pem;
try {
  pem = readFileSync(keyPath.replace(/^~/, process.env.HOME), "utf8");
} catch (error) {
  console.error(`Could not read the key file: ${error.message}`);
  process.exit(2);
}

if (!pem.includes("BEGIN PRIVATE KEY")) {
  console.error(
    "That file is not a PKCS#8 private key. An App Store Connect .p8 starts\n" +
      "with -----BEGIN PRIVATE KEY-----. Check you downloaded the right file."
  );
  process.exit(2);
}

// Imported exactly the way the worker imports it, so a key the worker would
// choke on fails here first.
let privateKey;
try {
  const der = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");
  privateKey = await crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(der, "base64"),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
} catch (error) {
  console.error(`The key would not import as a P-256 private key: ${error.message}`);
  process.exit(2);
}

const now = Math.floor(Date.now() / 1000);
const header = base64Url(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
const claims = base64Url(
  JSON.stringify({
    iss: issuerId,
    iat: now,
    exp: now + 900,
    aud: "appstoreconnect-v1",
    bid: BUNDLE_ID,
  })
);
const signature = await crypto.subtle.sign(
  { name: "ECDSA", hash: "SHA-256" },
  privateKey,
  new TextEncoder().encode(`${header}.${claims}`)
);
const token = `${header}.${claims}.${base64Url(Buffer.from(signature))}`;

console.log(`\nSigned a JWT for bundle ${BUNDLE_ID}.`);
console.log(`Key ID ${keyId}, issuer ${issuerId.slice(0, 8)}...\n`);

let anyAuthenticated = false;

for (const [label, host] of HOSTS) {
  const url = `${host}/inApps/v1/subscriptions/${PROBE_TRANSACTION_ID}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    });
  } catch (error) {
    console.log(`  ${label.padEnd(11)} could not reach Apple: ${error.message}`);
    continue;
  }

  const body = await response.text();
  if (response.status === 404) {
    anyAuthenticated = true;
    console.log(`  ${label.padEnd(11)} OK. Authenticated, and the probe ID is unknown as expected.`);
  } else if (response.status === 401) {
    console.log(`  ${label.padEnd(11)} REJECTED. Apple would not accept these credentials.`);
  } else if (response.status === 200) {
    anyAuthenticated = true;
    console.log(`  ${label.padEnd(11)} OK. Authenticated (and somehow knows the probe ID).`);
  } else {
    console.log(`  ${label.padEnd(11)} unexpected ${response.status}: ${body.slice(0, 200)}`);
  }
}

if (anyAuthenticated) {
  console.log("\nThese credentials work. Safe to set as worker secrets.\n");
  process.exit(0);
}

console.log(
  "\nApple rejected these credentials. The usual causes, most likely first:\n" +
    "  1. The key is a Team Key. The App Store Server API needs a key created\n" +
    "     under Users and Access, Integrations, In-App Purchase.\n" +
    "  2. The Issuer ID is the one from the App Store Connect API page rather\n" +
    "     than the one printed on the In-App Purchase key page. They differ.\n" +
    "  3. The Key ID does not match the key file.\n"
);
process.exit(1);
