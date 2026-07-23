// MealTime relay worker for Cloudflare.
//
// What this does: the iPhone app sends its meal-plan request here instead of
// straight to Anthropic. This worker adds the secret API key (stored safely
// on Cloudflare, never inside the app) and passes the request along to
// Anthropic, then hands Anthropic's answer back to the app unchanged.
//
// Secrets this worker expects (set with "wrangler secret put", see README.md):
//   ANTHROPIC_API_KEY  required. Your Anthropic API key.
//   APP_TOKEN          optional. A long random string. If set, the app must
//                      send the same string in an "x-app-token" header, which
//                      stops strangers from using your relay if they find the
//                      URL.
//
// No request or response bodies are logged anywhere in this file. Keep it
// that way: bodies contain the household's meal plans.

// Reject request bodies over 1 MB. Meal plan requests are a few KB at most,
// so anything bigger is not coming from the app.
const MAX_BODY_BYTES = 1024 * 1024;

export default {
  async fetch(request, env) {
    // Only POST is allowed. Anything else (GET from a browser, etc.) is
    // turned away.
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // If an APP_TOKEN secret is configured, the caller must present the
    // matching x-app-token header.
    if (env.APP_TOKEN) {
      if (request.headers.get("x-app-token") !== env.APP_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // Read the whole body once so we can check its size.
    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) {
      return new Response("Request body too large", { status: 413 });
    }

    // Forward the request to Anthropic with the server-side key attached.
    // The anthropic-version header comes from the app; fall back to the
    // known-good value if it is missing.
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version":
          request.headers.get("anthropic-version") || "2023-06-01",
        "content-type": "application/json",
      },
      body,
    });

    // Return Anthropic's status and body verbatim so the app can parse the
    // response exactly as if it had called Anthropic directly.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  },
};
