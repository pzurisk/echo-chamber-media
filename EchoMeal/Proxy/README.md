# MealTime proxy (Cloudflare Worker)

This tiny relay keeps the Anthropic API key off the phone. The app sends its
request to the Worker, the Worker adds the key and forwards the request to
Anthropic, and the answer comes back unchanged. Anyone who unzips the app
finds no key inside.

The free Cloudflare plan allows 100,000 requests per day. One household
planning a week of dinners uses a handful of requests per week, so the free
plan is plenty. It never needs a credit card for this.

## One-time setup

1. Make a free Cloudflare account at https://dash.cloudflare.com if you do
   not have one.

2. Install wrangler, Cloudflare's command line tool (needs Node.js):

   ```bash
   npm install -g wrangler
   ```

3. Log in. This opens a browser window; approve it:

   ```bash
   wrangler login
   ```

4. In this Proxy folder, create a file named `wrangler.toml` with exactly
   this content:

   ```toml
   name = "mealtime-proxy"
   main = "worker.js"
   compatibility_date = "2026-01-01"
   ```

5. Deploy the worker from this folder:

   ```bash
   wrangler deploy
   ```

   Wrangler prints the public URL, something like
   `https://mealtime-proxy.your-name.workers.dev`. Copy it, you need it in
   step 7.

6. Give the worker its secrets. Each command prompts you to paste the
   value, which is stored encrypted on Cloudflare and never shown again:

   ```bash
   wrangler secret put ANTHROPIC_API_KEY
   wrangler secret put APP_TOKEN
   wrangler secret put APPLE_KEY_ID
   wrangler secret put APPLE_ISSUER_ID
   wrangler secret put APPLE_PRIVATE_KEY < AuthKey_XXXXXXXXXX.p8
   ```

   ANTHROPIC_API_KEY is your key from https://console.anthropic.com.

   APP_TOKEN is any long random string you invent (30 or more characters,
   letters and numbers). It proves a request came from a copy of MealTime
   and nothing more, because it ships inside the app where anyone can read
   it. Save the same string for step 7.

   The three APPLE_ values are what let the worker check a subscription
   with Apple instead of taking the app's word for it. Without them the
   relay refuses every request on purpose, because a relay that cannot
   check a subscription is a paywall anyone can walk through.

   Get them from App Store Connect, under Users and Access, then
   Integrations, then In-App Purchase:

   - Click the plus, name the key something like "MealTime relay", and
     download the `.p8`. **Apple lets you download it once.** Put it
     somewhere safe outside this repo.
   - APPLE_KEY_ID is the Key ID in that row.
   - APPLE_ISSUER_ID is the Issuer ID printed above the key list.
   - APPLE_PRIVATE_KEY is the whole `.p8` file, BEGIN and END lines
     included. Pipe the file in as shown rather than pasting it, so the
     line breaks survive.

   None of the three is ever sent to the phone, and none is ever logged.

7. Point the app at the worker. Open `Secrets.xcconfig` (one folder up,
   copied from `Secrets.example.xcconfig`) and set:

   ```
   CLAUDE_PROXY_URL = https:/$()/mealtime-proxy.your-name.workers.dev
   CLAUDE_PROXY_TOKEN = the-same-random-string-from-step-6
   ```

   The odd looking `https:/$()/` is on purpose. In xcconfig files a plain
   `//` starts a comment and would cut the URL in half. `$()` expands to
   nothing at build time, so the app still gets a normal `https://` URL.

   There is no Anthropic key line in this file anymore, and there should
   not be one. The app has no direct-to-Anthropic mode: every request goes
   through the relay, and the key lives only in Cloudflare's secret store.

8. Rebuild the app in Xcode and verify: open the Speak tab, generate a
   plan, and confirm the Week and List tabs fill in. If they do, the request
   went through your worker. You can also watch requests arrive live with
   `wrangler tail` while you test.

   Testing through TestFlight works out of the box, because
   `ALLOW_SANDBOX_SUBSCRIPTIONS` in `wrangler.toml` defaults to on and
   TestFlight purchases live in Apple's sandbox. Set it to `"0"` and
   redeploy once the build is public if you want only real paid
   subscriptions accepted.

## Checking the subscription logic

`test/verify-test.mjs` drives the real worker with Apple and Anthropic
stubbed out and the JWT signing left real, against a throwaway key it
generates per run. No credentials needed, nothing hits the network:

```bash
node test/verify-test.mjs
```

It covers forged transaction IDs, every Apple subscription status, a
transaction for the wrong product or the wrong app, the sandbox
fallthrough, every failure path, and a check that the token the worker
sends Apple is a valid ES256 JWT whose signature actually verifies.
Run it after any change to the verification code.

## Rotating the Anthropic key later

If the key ever leaks or you just want a fresh one, make a new key in the
Anthropic console, then run:

```bash
wrangler secret put ANTHROPIC_API_KEY
```

and paste the new key. That is the whole rotation. The app never needs an
update because the key only ever lived on Cloudflare. Deactivate the old
key in the Anthropic console afterward.

The same command with APP_TOKEN rotates the app token, but that one does
require updating `Secrets.xcconfig` and shipping a new build, so only
rotate it if you think it leaked.
