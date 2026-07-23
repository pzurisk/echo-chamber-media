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

6. Give the worker its two secrets. Each command prompts you to paste the
   value, which is stored encrypted on Cloudflare and never shown again:

   ```bash
   wrangler secret put ANTHROPIC_API_KEY
   wrangler secret put APP_TOKEN
   ```

   ANTHROPIC_API_KEY is your key from https://console.anthropic.com.
   APP_TOKEN is any long random string you invent (30 or more characters,
   letters and numbers). It acts like a password so only the app can use
   your relay. Save the same string for step 7.

7. Point the app at the worker. Open `Secrets.xcconfig` (one folder up,
   copied from `Secrets.example.xcconfig`) and set:

   ```
   CLAUDE_PROXY_URL = https:/$()/mealtime-proxy.your-name.workers.dev
   CLAUDE_PROXY_TOKEN = the-same-random-string-from-step-6
   ```

   The odd looking `https:/$()/` is on purpose. In xcconfig files a plain
   `//` starts a comment and would cut the URL in half. `$()` expands to
   nothing at build time, so the app still gets a normal `https://` URL.

   For App Store builds, also blank out the key line so no key ships in the
   binary at all:

   ```
   ANTHROPIC_API_KEY =
   ```

8. Rebuild the app in Xcode and verify: open the Speak tab, generate a
   plan, and confirm the Week and List tabs fill in. If they do, the request
   went through your worker. You can also watch requests arrive live with
   `wrangler tail` while you test.

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
