import Foundation

/// Calls the Anthropic Messages API and turns a voice transcript into a MealPlan.
///
/// Two modes, chosen at build time from the gitignored Secrets.xcconfig:
/// - Proxy mode: if CLAUDE_PROXY_URL is set in Info.plist, requests go to the
///   Cloudflare Worker relay (see Proxy/README.md). The Anthropic key lives
///   server side and no key ships on the device. An optional CLAUDE_PROXY_TOKEN
///   is sent as the x-app-token header so only the app can use the relay.
/// - No proxy, no plan. There used to be a direct mode that called
///   api.anthropic.com with an ANTHROPIC_API_KEY embedded in Info.plist. That
///   path was removed on purpose: anyone can unzip a public .ipa and read the
///   key out of it. A missing or malformed CLAUDE_PROXY_URL is now a hard
///   failure rather than a silent fallback that reships the key.
enum ClaudeService {

    enum ClaudeError: LocalizedError {
        case missingKey
        case badStatus(Int, String)
        case emptyReply
        case parseFailed
        /// HTTP 402 from the relay: the subscription is fine, this month's
        /// included plans are used up. The relay sends back a readable
        /// sentence naming the date they come back, so it is shown as-is.
        case outOfPlans(String)
        /// HTTP 401 from the relay: it would not accept the subscription
        /// this request carried. AppState re-checks the entitlement before
        /// deciding whether this means "subscribe" or "something is off",
        /// so this case carries no user-facing text of its own.
        case subscriptionRefused

        /// Plain sentences a non-programmer understands. The raw status code
        /// and body stay in the associated values for retry matching and
        /// debugging; they never reach the user.
        var errorDescription: String? {
            switch self {
            case .missingKey:
                return "The app is not connected to the planning service. This build is missing its proxy setting."
            case .outOfPlans(let message):
                // The relay wrote this sentence for the user. Passing it
                // through is what puts the real reset date in the alert.
                return message
            case .subscriptionRefused:
                return "MealTime could not confirm your subscription. Open Settings and tap Restore Purchases."
            case .badStatus(let code, _):
                switch code {
                case 401, 403:
                    return "The planning service rejected the key. Check the app's setup."
                case 429:
                    return "The planning service is busy. Wait a minute and try again."
                case 500...599:
                    return "The planning service had a hiccup. Try again."
                default:
                    return "The planning service could not be reached."
                }
            case .emptyReply:
                return "The planning service sent back an empty reply. Try again."
            case .parseFailed:
                return "The plan came back scrambled. Tap the button and try again."
            }
        }
    }

    // MARK: - Runtime system prompt

    /// Days in plan order. The requested dinner count selects a prefix:
    /// 5 dinners run Monday through Friday, 3 run Monday through Wednesday,
    /// 7 run Monday through Sunday.
    private static let dayNames = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ]

    /// Builds the system prompt for the requested number of dinners. The
    /// prompt used to be a frozen constant hardcoded to 5 weeknights; the
    /// dinner count and day list now follow the household's setting.
    static func systemPrompt(dinners: Int) -> String {
        let count = min(max(dinners, 1), 7)
        let days = dayNames.prefix(count)
        let first = days.first ?? "Monday"
        let last = days.last ?? "Friday"
        let span = count == 1 ? "on \(first)" : "\(first) through \(last)"
        return """
You plan weekly dinners for a two-person household. You will receive a short, possibly messy voice transcript of cravings, proteins, or dish ideas. Build a full \(count)-dinner plan, \(span), around whatever they mention, and fill the remaining nights yourself with dinners that fit.

Rules:
- Bold, global flavors. Cook time 30 to 60 minutes per meal.
- Maximize ingredient overlap. Reuse a small shared pool of pantry staples across the week to cut cost and waste.
- Cook for 2 people, leftovers fine.
- Respect the weekly budget target passed in the transcript context. Estimate realistic US grocery prices. Mark staples the household likely already owns as pantry items and subtract their cost. Report the estimated total and whether it is under or over target.
- Consolidate duplicate ingredients across recipes into one grocery entry with the quantities summed.
- Every dinner is a complete plate: a protein, a carb or starch side (rice, pasta, potatoes, tortillas, bread, or grains), and a vegetable. The sides are part of the recipe, with their ingredients in the ingredient list, their prep in the steps, and their items on the grocery list. Never plan a protein-only dinner.
- Every grocery item carries a "recipes" array listing the exact title of each recipe in this plan that uses it. An item shared by several dinners lists all of them.

Variety, non-negotiable:
- No two dinners this week share a cuisine.
- At most two dinners share a primary protein, and only when the household asked for that protein. Otherwise every dinner uses a different one.
- Vary the cooking method across the week. Do not plan three skillet dinners. Mix searing, roasting, braising, grilling, and stir-frying.
- At least two dinners must use a cuisine or a primary technique that does not appear anywhere in the recent-dinner history you are given.

Craft. This is what separates a real dinner from filler:
- Build flavor with technique. Sear proteins hard for a crust, build fond in the pan, deglaze it, and finish the sauce in that same pan. Do not boil or steam what should be browned.
- Season in layers as you cook, not once at the end.
- Every plate needs fat and acid balanced against each other. Name the acid explicitly in the ingredients: citrus, vinegar, yogurt, or something pickled.
- Texture contrast is required in every dinner. Something crisp against something soft.
- Respect the ingredient. A simple preparation of something good beats a complicated preparation of something mediocre.
- Regional honesty. If a dish is Vietnamese, use the real aromatics. Never sand a cuisine down into a generic weeknight version of itself.
- Every step states why it matters in one short clause, so the cook learns instead of just obeying. Write "Sear undisturbed 4 minutes so a crust can form" rather than "sear the chicken."

Return JSON only. No prose, no markdown, no backticks. Match this schema exactly:

{
  "week": [
    { "day": "Monday", "title": "", "cuisine": "", "cookTimeMin": 0, "servings": 2 }
  ],
  "recipes": [
    { "day": "Monday", "title": "", "cookTimeMin": 0, "servings": 2,
      "ingredients": [ { "item": "", "qty": "" } ],
      "steps": [ "" ] }
  ],
  "grocery": {
    "budgetTarget": 100,
    "estimatedTotal": 0,
    "pantryCredit": 0,
    "notes": "",
    "sections": [
      { "name": "Proteins", "items": [ { "name": "", "qty": "", "estPrice": 0.0, "pantry": false, "recipes": [""] } ] }
    ]
  }
}

week and recipes each have exactly \(count) entries, one per day, \(span), in order. grocery.sections use only these names when relevant: Proteins, Produce, Pantry, Dairy, Bread, Sauces.
"""
    }

    // MARK: - Public entry point

    /// Sends the transcript to Claude. If the reply fails to parse as JSON,
    /// retries the call once with a corrective reminder appended. Also
    /// retries once, after a short pause, on transient transport failures
    /// (timeout, dropped connection, no network, unreachable host) and on
    /// HTTP 500 to 599 responses. 4xx errors never retry.
    /// tasteNotes carries what the app has learned about the household
    /// (favorites, cuisines they come back to, recent dinners) so the plan
    /// gets more personal over time.
    /// lockedRecipes are pinned dinners the household wants repeated exactly.
    /// They go into the user context only; the system prompt varies only by
    /// the requested dinner count.
    /// subscriptionID is the StoreKit originalTransactionId of the active
    /// subscription. The relay counts this month's plans against it and
    /// refuses any request without one, so callers must resolve it from
    /// SubscriptionStore before calling rather than passing a placeholder.
    static func planWeek(transcript: String, budget: Double, dinners: Int, subscriptionID: String, tasteNotes: String = "", lockedRecipes: [Recipe] = []) async throws -> MealPlan {
        var context = "Budget target: \(Int(budget)). Dinners: \(dinners). "
        if !tasteNotes.isEmpty {
            context += "Taste notes about this household: \(tasteNotes) "
        }
        if !lockedRecipes.isEmpty {
            let data = (try? JSONEncoder().encode(lockedRecipes)) ?? Data("[]".utf8)
            let json = String(data: data, encoding: .utf8) ?? "[]"
            if lockedRecipes.count >= dinners {
                context += "Locked dinners: the household wants these exact dinners included in the week again, unchanged (same title, ingredients, steps). Every day is locked, so do not invent any new dinners. Place each locked dinner on a sensible day and make sure the grocery list covers all of their ingredients. Locked dinners JSON: \(json) "
            } else {
                context += "Locked dinners: the household wants these exact dinners included in the week again, unchanged (same title, ingredients, steps). Place each on a sensible day, generate only the remaining \(dinners - lockedRecipes.count) dinners as new ideas, and make sure the grocery list covers the locked dinners' ingredients too. Locked dinners JSON: \(json) "
            }
        }
        context += "Cravings: \(transcript) "
        context += "Coverage rule: every single ingredient used by any recipe in the plan must appear on the grocery list, either as its own item or as a clearly matching combined item. The household shops from this list alone, so nothing may be missing."
        do {
            return try await requestPlan(userText: context, dinners: dinners, subscriptionID: subscriptionID)
        } catch ClaudeError.parseFailed {
            let reminder = context + "\n\nReminder: return only valid JSON matching the schema. No prose, no markdown, no backticks. The \"recipes\" array is required and must contain one full recipe object for every day in \"week\" (same count, matching \"day\" values), each with its ingredients and numbered steps. Do not return an empty or partial recipes array."
            return try await requestPlan(userText: reminder, dinners: dinners, subscriptionID: subscriptionID)
        } catch let error as URLError where Self.transientURLErrorCodes.contains(error.code) {
            try await Task.sleep(nanoseconds: 2_000_000_000)
            return try await requestPlan(userText: context, dinners: dinners, subscriptionID: subscriptionID)
        } catch ClaudeError.badStatus(let code, _) where (500...599).contains(code) {
            try await Task.sleep(nanoseconds: 2_000_000_000)
            return try await requestPlan(userText: context, dinners: dinners, subscriptionID: subscriptionID)
        }
    }

    /// Transport failures worth one retry. Anything else fails immediately.
    private static let transientURLErrorCodes: Set<URLError.Code> = [
        .timedOut, .networkConnectionLost, .notConnectedToInternet, .cannotConnectToHost
    ]

    // MARK: - Request

    /// Reads an optional value from Info.plist. Values arrive there from
    /// Secrets.xcconfig via build settings, so an entry that was never set
    /// shows up as an empty string or as the raw unresolved "$(NAME)"
    /// placeholder. Both count as not configured.
    private static func configValue(_ key: String) -> String? {
        guard
            let value = Bundle.main.object(forInfoDictionaryKey: key) as? String,
            !value.isEmpty, !value.hasPrefix("$(")
        else {
            return nil
        }
        return value
    }

    private static func requestPlan(userText: String, dinners: Int, subscriptionID: String) async throws -> MealPlan {
        var request: URLRequest
        if let proxyString = configValue("CLAUDE_PROXY_URL"),
           let proxyURL = URL(string: proxyString) {
            // Proxy mode. The Worker holds the Anthropic key server side and
            // relays the response verbatim, so no key is needed on the device.
            request = URLRequest(url: proxyURL)
            if let token = configValue("CLAUDE_PROXY_TOKEN") {
                request.setValue(token, forHTTPHeaderField: "x-app-token")
            }
            // Who to bill this generation to. The relay refuses outright
            // without it, which is the whole point: the app token ships in
            // every copy of the app and proves nothing about who is asking.
            request.setValue(subscriptionID, forHTTPHeaderField: "x-txn-id")
        } else {
            // No fallback on purpose. Calling api.anthropic.com from the device
            // would need an API key inside the app bundle, which is readable by
            // anyone who unzips a shipped .ipa. If the proxy URL is missing or
            // unparseable, fail loudly here so a bad xcconfig shows up as a
            // broken build instead of a leaked key.
            throw ClaudeError.missingKey
        }
        request.httpMethod = "POST"
        // Careful with this number. The relay does not stream (it refuses a
        // "stream" key outright), so nothing arrives on this connection until
        // Claude has finished the entire plan. A week of dinners with full
        // recipes runs roughly 3,000 to 6,000 output tokens, which lands
        // somewhere between 30 and 100 seconds. The old value of 90 sat inside
        // that range, and timing out there is the expensive kind of failure:
        // the relay has already counted the generation against the
        // subscriber's monthly allowance by the time this fires, and
        // .timedOut is in transientURLErrorCodes, so the retry below spends a
        // second one. Two of their twenty, and no plan to show for it.
        //
        // 180 clears the slow tail without becoming an infinite wait. The real
        // backstop is still withPlanningDeadline in AppState at 240 seconds,
        // which bounds the whole attempt including the retry.
        request.timeoutInterval = 180
        // Note: the API version header is 2023-06-01. That value is the
        // current, correct one for the Messages API. The proxy forwards it.
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        request.setValue("application/json", forHTTPHeaderField: "content-type")

        let body: [String: Any] = [
            "model": "claude-sonnet-5",
            // Room for a full week: up to 7 recipes with ingredients and
            // steps, plus the grocery list. 8000 could clip a verbose plan
            // mid-JSON.
            "max_tokens": 16000,
            // claude-sonnet-5 runs adaptive (extended) thinking by DEFAULT when
            // the thinking field is omitted, and max_tokens caps thinking +
            // output combined. On a rich request (taste-history notes + the
            // retry reminder) the model spent ~8k+ tokens thinking before any
            // JSON, crowding out or truncating the plan and returning empty or
            // partial recipes. This is a strict structured-JSON task driven by
            // a detailed system prompt, so thinking adds little; disabling it
            // cut output from ~14k tokens to ~4k and made recipes reliably
            // complete. (Sonnet 5 accepts "disabled"; only Fable 5 rejects it.)
            "thinking": ["type": "disabled"],
            "system": systemPrompt(dinners: dinners),
            "messages": [
                ["role": "user", "content": userText]
            ]
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw ClaudeError.badStatus(0, "No HTTP response.")
        }
        guard http.statusCode == 200 else {
            let snippet = String(data: data, encoding: .utf8)?.prefix(300) ?? ""
            // The relay's two subscription answers get their own cases so
            // they never land in the generic "the service could not be
            // reached" bucket, and so neither can be swept into the 5xx
            // retry ladder below. Both are final: retrying spends nothing
            // and fixes nothing.
            switch http.statusCode {
            case 402:
                throw ClaudeError.outOfPlans(String(snippet))
            case 401:
                throw ClaudeError.subscriptionRefused
            default:
                throw ClaudeError.badStatus(http.statusCode, String(snippet))
            }
        }

        // Pull the first text block out of the reply. Claude Sonnet 5 can
        // include thinking blocks before the text, so filter by type instead
        // of assuming content[0] is text.
        guard
            let envelope = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let content = envelope["content"] as? [[String: Any]],
            let textBlock = content.first(where: { ($0["type"] as? String) == "text" }),
            let text = textBlock["text"] as? String,
            !text.isEmpty
        else {
            throw ClaudeError.emptyReply
        }

        let cleaned = stripFences(from: text)
        guard
            let planData = cleaned.data(using: .utf8),
            let plan = try? JSONDecoder().decode(MealPlan.self, from: planData)
        else {
            throw ClaudeError.parseFailed
        }
        // The model occasionally returns a well-formed plan with the week and
        // grocery list filled in but the recipes array empty (or short). That
        // decodes fine yet bricks the Week tab: every card looks up its recipe
        // by day, finds none, and renders a dead, non-tappable cell with no way
        // to favorite or rate. Treat a plan whose recipes do not cover every
        // planned day as a parse failure so planWeek retries with a corrective
        // reminder instead of saving an unusable plan.
        guard !plan.week.isEmpty, plan.recipes.count >= plan.week.count else {
            throw ClaudeError.parseFailed
        }
        return plan
    }

    /// Defensive cleanup in case the model wraps the JSON in markdown fences
    /// or adds stray text around it. Extracts the outermost JSON object.
    private static func stripFences(from text: String) -> String {
        var t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if t.hasPrefix("```") {
            t = t.replacingOccurrences(of: "```json", with: "")
                .replacingOccurrences(of: "```", with: "")
                .trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if let first = t.firstIndex(of: "{"), let last = t.lastIndex(of: "}") {
            t = String(t[first...last])
        }
        return t
    }
}
