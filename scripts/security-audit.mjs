#!/usr/bin/env node
// Security audit for echochambermedia.com, added 2026-07-30.
// Runs automatically before every `next build` (see "prebuild" in
// package.json), so Vercel refuses to deploy if any check fails.
// Run by hand any time: npm run security-audit
//
// What it enforces:
//   1. next.config.mjs still ships all six security headers.
//   2. Every third-party host that pages load from (script src, iframe
//      src, img src, fetch targets) is allowed by the CSP.
//   3. No .env-style secrets file is tracked by git.
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let ok = true;
const fail = (msg) => { console.error("SECURITY: " + msg); ok = false; };

// 1. Headers present in next.config.mjs
const config = readFileSync("next.config.mjs", "utf8");
for (const h of [
  "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy",
  "Permissions-Policy", "Strict-Transport-Security", "Content-Security-Policy",
]) {
  if (!config.includes(`"${h}"`)) fail(`next.config.mjs is missing the ${h} header`);
}
if (!config.includes("poweredByHeader: false")) {
  fail("next.config.mjs no longer sets poweredByHeader: false");
}

// 2. Every load-bearing external host must be in the CSP.
//    Anchor links (<a href>) don't load resources and are not checked.
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|css)$/.test(name)) out.push(p);
  }
  return out;
};

const loadPatterns = [
  /src=\{?[`"']https?:\/\/([^/`"'}]+)/g,        // <Script src>, <iframe src>, <img src>
  /fetch\(\s*[`"']https?:\/\/([^/`"']+)/g,       // fetch() targets
  /url\(\s*[`"']?https?:\/\/([^/`"')]+)/g,       // CSS url()
];

for (const file of walk("src")) {
  const text = readFileSync(file, "utf8");
  for (const re of loadPatterns) {
    for (const m of text.matchAll(re)) {
      const host = m[1];
      if (host.endsWith("echochambermedia.com")) continue;
      if (!config.includes(host)) {
        fail(`${file} loads from ${host}, which the CSP in next.config.mjs does not allow`);
      }
    }
  }
}

// 3. No tracked secrets files.
// Template files (.env.example and friends) are meant to be tracked: they hold
// placeholder values only and document what a real .env needs. coproducer's
// setup step is literally "cp .env.example .env". A real .env, or any other
// .env.<something>, is still a failure.
const tracked = execSync("git ls-files", { encoding: "utf8" });
for (const line of tracked.split("\n")) {
  if (/(^|\/)\.env(\.|$)/.test(line) && !/\.(example|sample|template)$/.test(line)) {
    fail(`secrets file tracked by git: ${line}`);
  }
}

if (ok) {
  console.log("Security audit passed.");
} else {
  console.error("SECURITY AUDIT FAILED. Fix the issues above before deploying.");
  process.exit(1);
}
