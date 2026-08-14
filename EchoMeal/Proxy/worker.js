// MealTime relay worker for Cloudflare.
//
// What this does: the iPhone app sends its meal-plan request here instead of
// straight to Anthropic. This worker checks the request is one the app could
// actually have sent, adds the secret API key (stored safely on Cloudflare,
// never inside the app), passes it to Anthropic, and hands the answer back.
//
// Why the checking matters: APP_TOKEN ships inside every copy of the app, so
// anyone who unzips an .ipa can find it. The token proves a request came from
// a copy of MealTime. It does not prove the request is honest. Everything
// below assumes the token is public and limits what a holder of it can spend.
//
// Secrets this worker expects (set with "wrangler secret put", see README.md):
//   ANTHROPIC_API_KEY  required. Your Anthropic API key.
//   APP_TOKEN          optional. A long random string. If set, the app must
//                      send the same string in an "x-app-token" header.
//
// Plain variables and bindings live in wrangler.toml:
//   DAILY_REQUEST_CAP        circuit breaker for the whole relay, per day.
//   MONTHLY_GENERATION_CAP   how many plans one subscription gets per month.
//   SPEND_COUNTER            KV namespace holding those counts. Nothing else.
//   BURST_LIMITER            per-caller rate limit, in memory at the edge.
//
// Headers the app sends:
//   x-app-token  the shared secret above.
//   x-txn-id     the subscriber's StoreKit originalTransactionId. This is the
//                quota key. It is client-supplied, so it can be forged by
//                anyone who inspects the traffic. Forging one buys 20 plans a
//                month and nothing else; the daily ceiling below is the real
//                protection. The unforgeable fix is to send the signed JWS
//                transaction and verify it here against Apple's certificates
//                offline. That is planned for 1.4 and is a deliberate,
//                time-boxed tradeoff, not an oversight.
//
// No request or response bodies are logged anywhere in this file. Keep it
// that way: bodies contain the household's meal plans. KV holds two kinds of
// integer and nothing else: a count for the day, and a count for one
// subscription in one month. No name, no email, no IP, no meal plan. That is
// what the published privacy policy promises, so keep it true.

// Reject bodies over 64 KB. A real meal plan request measures 10 to 15 KB, so
// this leaves four times the headroom the app needs. The old limit was 1 MB,
// which is roughly 250,000 input tokens, about a dollar a request.
const MAX_BODY_BYTES = 64 * 1024;

// Per-field ceilings. The body cap above is the real bound on total size;
// these stop one oversized field from eating the whole allowance.
const MAX_FIELD_CHARS = 32 * 1024;
const MAX_MESSAGES = 8;

// Pinned upstream settings. Whatever the caller asks for, these win. This is
// what stops someone from pointing the relay at a pricier model or asking for
// a much longer answer than the app ever needs.
const PINNED_MODEL = "claude-sonnet-5";
const MAX_OUTPUT_TOKENS = 16000;
const ANTHROPIC_VERSION = "2023-06-01";

// The only top-level keys the app sends. Anything else, including "stream",
// is refused rather than quietly dropped.
const ALLOWED_KEYS = new Set([
  "model",
  "max_tokens",
  "thinking",
  "system",
  "messages",
]);
const ALLOWED_ROLES = new Set(["user", "assistant"]);

const DEFAULT_DAILY_CAP = 400;
const COUNTER_TTL_SECONDS = 172800; // two days, so old day keys clean themselves up

// One subscription's allowance for one calendar month. The app shows this
// number on the paywall before purchase, so changing it here means changing it
// there and in the App Store description too.
const DEFAULT_MONTHLY_CAP = 20;

// Month keys have to outlive the month they count. Forty days covers the
// longest month plus a week of slack, and then the key deletes itself.
const MONTH_COUNTER_TTL_SECONDS = 3456000;

// A transaction ID becomes part of a KV key, so it is checked before use. Real
// Apple originalTransactionId values are short numeric strings; sandbox values
// have been alphanumeric in the past, so letters are allowed and everything
// else is not. Bounding the length stops a caller from writing enormous keys.
const TXN_ID_PATTERN = /^[A-Za-z0-9]{1,64}$/;

// Read a cap out of the environment. Written the long way instead of
// `parseInt(x, 10) || fallback` because that idiom treats 0 as missing: a cap
// deliberately set to "0" to stop all spending would silently come back as
// the default and keep spending. Zero is a legitimate value here and the
// fastest lever there is for shutting the relay off in an emergency, so it
// has to survive. Anything unparseable or negative still falls back.
function capFrom(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

// Compare two strings without leaking where they first differ.
function tokensMatch(given, expected) {
  if (typeof given !== "string" || typeof expected !== "string") return false;
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

// Turn an IP into a short non-reversible fingerprint (FNV-1a). Used only as an
// in-memory rate limit key. Never stored.
function fingerprint(value) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// The month a quota belongs to, as YYYY-MM in UTC. Everything here runs in UTC
// so a subscriber's month does not shift with their timezone.
function monthStamp(now) {
  return now.toISOString().slice(0, 7);
}

// When the allowance comes back, in words the app can show as-is. Quotas reset
// on the first of the next month.
function nextResetLabel(now) {
  const month = now.getUTCMonth();
  const rolls = month === 11;
  return `${MONTH_NAMES[rolls ? 0 : month + 1]} 1`;
}

// Errors come back as plain readable sentences because the app surfaces the
// first 300 characters of a failed response directly to the user.
function refuse(status, message) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

// Check the parsed body looks like something the app would send, then rebuild
// it from scratch with the pinned settings. Returns a string on rejection.
function buildUpstreamPayload(parsed) {
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return "Request body must be a JSON object.";
  }

  for (const key of Object.keys(parsed)) {
    if (!ALLOWED_KEYS.has(key)) {
      return `Unsupported field in request: ${key}`;
    }
  }

  if (parsed.system !== undefined) {
    if (typeof parsed.system !== "string") {
      return "The system field must be text.";
    }
    if (parsed.system.length > MAX_FIELD_CHARS) {
      return "The system field is too long.";
    }
  }

  if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
    return "Request must include at least one message.";
  }
  if (parsed.messages.length > MAX_MESSAGES) {
    return "Too many messages in one request.";
  }

  const messages = [];
  for (const message of parsed.messages) {
    if (message === null || typeof message !== "object" || Array.isArray(message)) {
      return "Each message must be a JSON object.";
    }
    if (!ALLOWED_ROLES.has(message.role)) {
      return "Each message needs a role of user or assistant.";
    }
    // The app sends plain string content. Content blocks are refused on
    // purpose: if a future build needs them, widen this check deliberately.
    if (typeof message.content !== "string") {
      return "Message content must be text.";
    }
    if (message.content.length > MAX_FIELD_CHARS) {
      return "A message is too long.";
    }
    messages.push({ role: message.role, content: message.content });
  }

  // max_tokens is clamped, not trusted. A missing or silly value becomes the
  // app's normal ceiling rather than an error.
  let maxTokens = MAX_OUTPUT_TOKENS;
  if (parsed.max_tokens !== undefined) {
    if (!Number.isInteger(parsed.max_tokens) || parsed.max_tokens < 1) {
      return "max_tokens must be a positive whole number.";
    }
    maxTokens = Math.min(parsed.max_tokens, MAX_OUTPUT_TOKENS);
  }

  const payload = {
    model: PINNED_MODEL,
    max_tokens: maxTokens,
    // Thinking stays off. This is a deliberate fix for a real bug, not a
    // default worth changing to chase variety. See ClaudeService.swift.
    thinking: { type: "disabled" },
    messages,
  };
  if (parsed.system !== undefined) {
    payload.system = parsed.system;
  }
  return payload;
}

export default {
  async fetch(request, env) {
    // 1. Only POST. A browser GET gets nothing.
    if (request.method !== "POST") {
      return refuse(405, "Method not allowed.");
    }

    // 2. Shared app token.
    if (env.APP_TOKEN) {
      if (!tokensMatch(request.headers.get("x-app-token"), env.APP_TOKEN)) {
        return refuse(401, "Unauthorized.");
      }
    }

    // 3. Subscription identifier. Every paying copy of the app sends the
    // StoreKit originalTransactionId, which is what the monthly quota counts
    // against. No header means the caller is not a subscriber, or is an older
    // build, and either way there is no allowance to spend.
    const txnId = request.headers.get("x-txn-id");
    if (!txnId || !TXN_ID_PATTERN.test(txnId)) {
      return refuse(
        401,
        "MealTime could not confirm your subscription. Open Settings and tap Restore Purchases."
      );
    }

    // 4. Burst limit, before any work is done on the body. Keyed on a hash of
    // the caller's IP so one machine cannot hammer the relay.
    if (env.BURST_LIMITER) {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const { success } = await env.BURST_LIMITER.limit({ key: fingerprint(ip) });
      if (!success) {
        return refuse(
          429,
          "MealTime is being asked for too many plans at once. Wait a minute and try again."
        );
      }
    }

    // 5. Size check before parsing.
    const raw = await request.arrayBuffer();
    if (raw.byteLength > MAX_BODY_BYTES) {
      return refuse(413, "That request is too large to send.");
    }

    // 6. Parse. Anything unparseable stops here and costs nothing.
    let parsed;
    try {
      parsed = JSON.parse(new TextDecoder().decode(raw));
    } catch {
      return refuse(400, "Request body was not valid JSON.");
    }

    // 7. Validate the shape and rebuild with pinned model and settings.
    const payload = buildUpstreamPayload(parsed);
    if (typeof payload === "string") {
      return refuse(400, payload);
    }

    // 8. Per-subscription monthly quota. This is the allowance the subscriber
    // actually pays for, and it is checked before the global ceiling below on
    // purpose: a global trip is an outage for everybody, while this one is a
    // clean, explainable refusal for a single household.
    //
    // The status code is 402 and nothing else in this worker uses it. That is
    // the contract with the app: 402 means "out of plans, here is the date
    // they come back," never "your subscription is bad" and never "show the
    // paywall." A lapsed subscription comes back as 401 at step 3 instead.
    const monthlyCap = capFrom(env.MONTHLY_GENERATION_CAP, DEFAULT_MONTHLY_CAP);
    const now = new Date();
    const monthKey = `sub-${txnId}-${monthStamp(now)}`;
    let monthUsed = null;
    if (env.SPEND_COUNTER) {
      try {
        monthUsed =
          Number.parseInt(await env.SPEND_COUNTER.get(monthKey), 10) || 0;
      } catch {
        monthUsed = null;
      }
    }
    // A cap of 0 is the emergency stop, not a spent allowance, so it gets its
    // own sentence. The normal message would read "You have used all 0 meal
    // plans included this month," which tells a paying customer nothing true.
    if (monthlyCap === 0) {
      return refuse(
        402,
        "MealTime plan generation is paused right now. This is not a problem with your subscription, and you have not been charged for anything you did not get. Try again later."
      );
    }
    if (monthUsed !== null) {
      if (monthUsed >= monthlyCap) {
        return refuse(
          402,
          `You have used all ${monthlyCap} meal plans included this month. Your next ${monthlyCap} arrive on ${nextResetLabel(now)}.`
        );
      }
      // Count before spending, same as the daily counter, so a burst of
      // requests cannot slip past the cap while the first is still in flight.
      try {
        await env.SPEND_COUNTER.put(monthKey, String(monthUsed + 1), {
          expirationTtl: MONTH_COUNTER_TTL_SECONDS,
        });
      } catch {
        // A KV write failure is not a reason to refuse a paying subscriber.
      }
    }

    // 9. Daily ceiling. One integer per calendar day in KV, no other data.
    // If KV itself is unavailable the request is allowed through: the burst
    // limit above and the monthly spend cap set at Anthropic are the other two
    // lines of defence, and failing closed would take the app down for a
    // Cloudflare storage blip.
    const cap = capFrom(env.DAILY_REQUEST_CAP, DEFAULT_DAILY_CAP);
    const counterKey = `requests-${new Date().toISOString().slice(0, 10)}`;
    let used = null;
    if (env.SPEND_COUNTER) {
      try {
        used = Number.parseInt(await env.SPEND_COUNTER.get(counterKey), 10) || 0;
      } catch {
        used = null;
      }
    }
    if (used !== null) {
      if (used >= cap) {
        return refuse(
          429,
          "MealTime has hit its daily planning limit. Try again tomorrow."
        );
      }
      // Count it before spending it, so a rush of requests cannot slip past
      // the cap while the first one is still in flight.
      try {
        await env.SPEND_COUNTER.put(counterKey, String(used + 1), {
          expirationTtl: COUNTER_TTL_SECONDS,
        });
      } catch {
        // Counting failed. Carry on for the same reason as above.
      }
    }

    // 10. Forward. The version header is pinned here rather than taken from the
    // caller, and the body is the rebuilt payload, not whatever arrived.
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // A failed upstream call costs nothing, so hand the day's allowance back.
    // Otherwise a bad afternoon at Anthropic would burn the whole cap on
    // retries and leave the app dead until midnight.
    if (!upstream.ok && used !== null) {
      try {
        await env.SPEND_COUNTER.put(counterKey, String(used), {
          expirationTtl: COUNTER_TTL_SECONDS,
        });
      } catch {
        // Nothing to do. The count stays one high for the day.
      }
    }

    // Same for the subscriber's own allowance. A failed plan is not a plan, and
    // charging someone a generation for Anthropic having a bad minute is the
    // kind of thing that gets a subscription cancelled.
    if (!upstream.ok && monthUsed !== null) {
      try {
        await env.SPEND_COUNTER.put(monthKey, String(monthUsed), {
          expirationTtl: MONTH_COUNTER_TTL_SECONDS,
        });
      } catch {
        // Nothing to do. The count stays one high for the month.
      }
    }

    // Anthropic's own auth and billing failures arrive as 401, 402, and 403,
    // which are the exact codes this worker reserves for its subscription
    // contract with the app. Verified against the live API: a request with no
    // key comes back 401 "invalid x-api-key", identical in status to this
    // worker's "no subscription" refusal, and the app cannot tell them apart.
    //
    // So they are remapped. A dead or unpaid Anthropic key is a problem at
    // this end, and it must never reach a paying subscriber as "your
    // subscription could not be confirmed," because the only action that
    // message suggests is cancelling. 502 lands in the app's transient
    // bucket instead, which is the truth: try again later.
    if (upstream.status === 401 || upstream.status === 402 || upstream.status === 403) {
      return refuse(
        502,
        "MealTime's planning service is not answering right now. This is not a problem with your subscription. Try again in a few minutes."
      );
    }

    // Return Anthropic's status and body verbatim so the app can parse the
    // response exactly as if it had called Anthropic directly.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  },
};
