import Foundation
import os

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

    /// Request and response logging for every relay call. Statuses, labels,
    /// and sizes are marked public so Console shows them. The prompt text
    /// itself carries the household's taste notes, pantry, and history, so
    /// it is logged as private: it redacts in the unified log on a device
    /// that is not attached to a debugger. If Console proves unreliable
    /// again, the devicectl stdout method in the vault's 524 writeup still
    /// applies.
    static let logger = Logger(subsystem: "com.echochambermedia.echomeal", category: "claude")

    /// Console truncates one interpolated string near 1 KB, which would cut
    /// the outgoing prompt mid-sentence and defeat the point of logging it.
    /// Chunked lines survive intact; filter on the label to reassemble. The
    /// label stays public; the chunk is private (see the logger note).
    private static func logLongText(_ label: String, _ text: String) {
        let chunkSize = 800
        var start = text.startIndex
        var part = 1
        while start < text.endIndex {
            let end = text.index(start, offsetBy: chunkSize, limitedBy: text.endIndex) ?? text.endIndex
            let chunk = String(text[start..<end])
            logger.info("\(label, privacy: .public) [\(part, privacy: .public)]: \(chunk, privacy: .private)")
            start = end
            part += 1
        }
    }

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
            case .badStatus(let code, let body):
                switch code {
                case 401, 403:
                    return "The planning service rejected the key. Check the app's setup."
                case 429:
                    // The relay sends two different 429s. The burst limiter
                    // really does clear in a minute; the household and
                    // service-wide caps clear at the next UTC day, so
                    // "busy, wait a minute" would send people in circles.
                    if body.lowercased().contains("too many") {
                        return "The planning service is busy. Wait a minute and try again."
                    }
                    return "MealTime has hit its daily limit. It clears tomorrow, so try again then."
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
    /// webSearchEnabled appends the instruction for using the web_search
    /// tool the Worker attaches when the app asks for it; the prompt itself
    /// says nothing about search when the tool is not there to use.
    static func systemPrompt(dinners: Int, webSearchEnabled: Bool = false) -> String {
        let count = min(max(dinners, 1), 7)
        let days = dayNames.prefix(count)
        let first = days.first ?? "Monday"
        let last = days.last ?? "Friday"
        let span = count == 1 ? "on \(first)" : "\(first) through \(last)"
        let webSearchInstructions = webSearchEnabled ? """


Web search, enabled for this plan:
- You have a web_search tool. Use it, a few searches at most, to find dishes that are genuinely trending or widely praised online right now.
- Let one or two of this week's dinners be inspired by an actual dish you find that way, adapted into a real 30 to 60 minute weeknight meal for two that still follows every rule above: variety, craft, budget, a complete plate.
- Everything else in the week comes from your own judgment as usual.
- Do not describe your search or cite a source in the output. Return JSON only, matching the schema exactly, with no extra fields.
""" : ""
        return """
You plan weekly dinners for a two-person household. You will receive the household's request. Sometimes it is a short, messy voice transcript of cravings, and sometimes it is a detailed typed brief with a specific style in mind. Build a full \(count)-dinner plan, \(span), from that request, and fill whatever it leaves open with dinners that fit.

The request outranks everything below. When it names a style, a theme, example dishes, a cuisine to stay inside, a protein to repeat, an appetizer, a comfort level, or any other explicit instruction, follow it exactly, even where it contradicts a rule in this prompt. The rules below are defaults for the parts of the week the request leaves open, never a reason to override what the household actually asked for. Taste notes in the context are background about the household and also never override the request.

Rules:
- Bold, global flavors by default. If the request points elsewhere (comfort food, familiar dishes, one cuisine, nothing exotic), its direction wins. Cook time 30 to 60 minutes per meal.
- Maximize ingredient overlap. Reuse a small shared pool of pantry staples across the week to cut cost and waste.
- Cook for 2 people, leftovers fine.
- Respect the weekly budget target passed in the transcript context. Estimate realistic US grocery prices. Mark staples the household likely already owns as pantry items and subtract their cost. Report the estimated total and whether it is under or over target.
- Consolidate duplicate ingredients across recipes into one grocery entry with the quantities summed.
- Every dinner is a complete plate: a protein, a carb or starch side (rice, pasta, potatoes, tortillas, bread, or grains), and a vegetable. The sides are part of the recipe, with their ingredients in the ingredient list, their prep in the steps, and their items on the grocery list. Never plan a protein-only dinner. Exception: when the request asks for something else for one of the nights, like a shareable appetizer, give them exactly that instead of forcing it into a plate.
- Every grocery item carries a "recipes" array listing the exact title of each recipe in this plan that uses it. An item shared by several dinners lists all of them.

Variety, required unless the request asks otherwise (a themed week, one cuisine, a repeated protein, or a specific style the household spelled out always wins):
- No two dinners this week share a cuisine.
- At most two dinners share a primary protein, unless the request centers on one protein. Otherwise every dinner uses a different one.
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

Leftovers, a soft nudge, not a rule:
- For any dinner where cooking a larger batch is natural and the extra keeps well 1 to 2 days (braises, roasts, chili, curry, a big pot of grains or beans), set "leftoverYield": true on its recipe entry and size the recipe to intentionally yield a second meal's worth, not just dinner-night portions.
- Where it genuinely fits, pair a leftoverYield dinner with a later dinner 1 to 2 days after it that reuses or riffs on that leftover: a second preparation of the same protein, or a different plate built around the leftover component. Only pair meals when the fit is real. Never force a bad pairing just to use this feature.
- When you pair two dinners this way, set "leftoverNote" on the LATER day's week entry to one short sentence naming the connection, e.g. "Uses leftover braised chicken from Monday." Every day without a pairing omits leftoverNote or leaves it empty.

Return JSON only. No prose, no markdown, no backticks. Match this schema exactly:

{
  "week": [
    { "day": "Monday", "title": "", "cuisine": "", "cookTimeMin": 0, "servings": 2, "leftoverNote": "" }
  ],
  "recipes": [
    { "day": "Monday", "title": "", "cookTimeMin": 0, "servings": 2,
      "ingredients": [ { "item": "", "qty": "" } ],
      "steps": [ "" ], "leftoverYield": false }
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

week and recipes each have exactly \(count) entries, one per day, \(span), in order. grocery.sections use only these names when relevant: Proteins, Produce, Pantry, Dairy, Bread, Sauces.\(webSearchInstructions)
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
    /// useWebSearch asks the Worker to attach its pinned web_search tool and
    /// switches in the search paragraph of the system prompt; the Worker,
    /// not this flag, is what actually authorizes the tool.
    /// purpose is the relay's billing tag: "plan" counts against the monthly
    /// plan allowance together with "swap". Left nil, it is read from the
    /// request: locked dinners plus the "Swap request:" text AppState writes
    /// for Swap One Night mean "swap", anything else means "plan". A caller
    /// that knows better can pass it explicitly.
    static func planWeek(transcript: String, budget: Double, dinners: Int, subscriptionID: String, tasteNotes: String = "", lockedRecipes: [Recipe] = [], useWebSearch: Bool = false, purpose: String? = nil) async throws -> MealPlan {
        let purpose = purpose ?? ((!lockedRecipes.isEmpty && transcript.hasPrefix("Swap request:")) ? "swap" : "plan")
        // The request leads the message and is labeled as the instruction to
        // follow. It used to sit mid-context as "Cravings:", after a wall of
        // taste notes, and a detailed typed brief got treated as loose
        // inspiration instead of instructions, which is the drift Billy saw.
        var context = "The household's request, the top instruction for this plan, follow it exactly: \(transcript)\n\n"
        context += "Context. Budget target: \(Int(budget)). Dinners: \(dinners). "
        if !tasteNotes.isEmpty {
            context += "Background taste notes about this household. These are defaults and history, never a reason to override the request above: \(tasteNotes) "
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
        // Trending dishes, when asked for, arrive as context from a separate
        // short search call rather than from a tool attached to this request.
        // See trendingDishes for why. An empty list means the lookup failed
        // or found nothing, and the week is planned normally instead of
        // failing, so this is a bonus and never a dependency.
        var planUsesSearchTool = useWebSearch
        if useWebSearch {
            let trending = await trendingDishes(subscriptionID: subscriptionID)
            if !trending.isEmpty {
                context += "Trending right now: these dishes are currently popular online: \(trending.joined(separator: ", ")). Let one or two of this week's dinners be inspired by one of them, adapted into a real 30 to 60 minute weeknight meal for two that still follows every rule above, including the variety rules. If the household's request sets a style, a theme, or specific dishes, work a trend in only where it genuinely fits that request, or skip the trends entirely; the request always wins. Everything else comes from your own judgment. Do not mention trends, searches, or sources anywhere in the output. "
            }
            // The tool never gets attached to the plan request either way.
            // Attaching it is what caused the 524.
            planUsesSearchTool = false
        }
        context += "Coverage rule: every single ingredient used by any recipe in the plan must appear on the grocery list, either as its own item or as a clearly matching combined item. The household shops from this list alone, so nothing may be missing."
        do {
            return try await requestPlan(userText: context, dinners: dinners, subscriptionID: subscriptionID, useWebSearch: planUsesSearchTool, purpose: purpose)
        } catch ClaudeError.parseFailed {
            logger.warning("Plan reply failed to parse. Retrying once with the JSON reminder appended.")
            let reminder = context + "\n\nReminder: return only valid JSON matching the schema. No prose, no markdown, no backticks. The \"recipes\" array is required and must contain one full recipe object for every day in \"week\" (same count, matching \"day\" values), each with its ingredients and numbered steps. Do not return an empty or partial recipes array."
            return try await requestPlan(userText: reminder, dinners: dinners, subscriptionID: subscriptionID, useWebSearch: planUsesSearchTool, purpose: purpose)
        } catch let error as URLError where Self.transientURLErrorCodes.contains(error.code) {
            logger.warning("Transport failure (\(error.code.rawValue, privacy: .public)). Retrying once after 2s.")
            try await Task.sleep(nanoseconds: 2_000_000_000)
            return try await requestPlan(userText: context, dinners: dinners, subscriptionID: subscriptionID, useWebSearch: planUsesSearchTool, purpose: purpose)
        } catch ClaudeError.badStatus(let code, _) where (500...599).contains(code) && code != 524 {
            // 524 is excluded deliberately. It is Cloudflare cutting the
            // connection after about 126 seconds, which is a deadline, not a
            // hiccup. Retrying it spends another 126 seconds to fail the same
            // way and pushes the whole attempt past the 240 second planning
            // deadline, so the household waits four minutes to be told the
            // connection is bad. Failing once and fast is the honest answer.
            logger.warning("Relay answered \(code, privacy: .public). Retrying once after 2s.")
            try await Task.sleep(nanoseconds: 2_000_000_000)
            return try await requestPlan(userText: context, dinners: dinners, subscriptionID: subscriptionID, useWebSearch: planUsesSearchTool, purpose: purpose)
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

    /// Builds a request to the relay with the shared headers. Split out of
    /// requestPlan so the trending-dish lookup can reuse it with its own,
    /// much shorter timeout instead of copying the header setup.
    private static func relayRequest(subscriptionID: String, timeout: TimeInterval) throws -> URLRequest {
        guard
            let proxyString = configValue("CLAUDE_PROXY_URL"),
            let proxyURL = URL(string: proxyString)
        else {
            // No fallback on purpose. Calling api.anthropic.com from the
            // device would need an API key inside the app bundle, readable by
            // anyone who unzips a shipped .ipa.
            throw ClaudeError.missingKey
        }
        var request = URLRequest(url: proxyURL)
        if let token = configValue("CLAUDE_PROXY_TOKEN") {
            request.setValue(token, forHTTPHeaderField: "x-app-token")
        }
        request.setValue(subscriptionID, forHTTPHeaderField: "x-txn-id")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.httpMethod = "POST"
        request.timeoutInterval = timeout
        return request
    }

    /// Asks Claude, with web search on, for a handful of dishes that are
    /// genuinely trending right now. Returns their names only.
    ///
    /// Why this is its own call. Running web search inside the plan request
    /// stacks up to four search round trips on top of a generation that
    /// already takes about 70 seconds, and nothing streams back because the
    /// relay returns the response whole. Cloudflare cuts the connection at
    /// roughly 126 seconds and answers 524, every time, deterministically:
    /// measured on device and from a Mac on 2026-08-28, 126.3s both. The
    /// plan Claude had built is thrown away at that moment.
    ///
    /// Splitting it keeps both requests comfortably under that wall. This
    /// one asks for names and nothing else, with a small token budget, so it
    /// returns in a few seconds. The plan call then runs with no tool at all,
    /// back to its normal ~70 seconds, with the names handed to it as
    /// context.
    ///
    /// Never throws. A trending lookup that fails must not cost the
    /// household their dinner plan, so every failure path returns an empty
    /// list and the week gets planned the ordinary way.
    static func trendingDishes(subscriptionID: String) async -> [String] {
        await searchDishes(subscriptionID: subscriptionID, userText: "What dinners are trending right now?")
    }

    /// The shelf's own version of trendingDishes: same prompt shape, same
    /// 75 second wall, same "never throws, [] on any failure" contract,
    /// tagged purpose "discovery" so the relay bills it to the shelf
    /// allowance rather than a plan.
    ///
    /// `signals` is accepted so the shelf code has one call shape, but none of
    /// it is sent. The privacy notice says no household data goes out with a
    /// web search, and a taste profile in the query would make that false. The
    /// household's taste meets the names later, inside the top-up prompt,
    /// which has no search tool. Only the month rides along, so "this
    /// season" means something.
    static func discoverDishes(signals: ShelfSignals, subscriptionID: String?) async -> [String] {
        _ = signals
        guard let subscriptionID, !subscriptionID.isEmpty else { return [] }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "MMMM yyyy"
        let month = formatter.string(from: Date())
        return await searchDishes(subscriptionID: subscriptionID, userText: "What dinners are trending right now, in \(month)?")
    }

    /// One web-search call for dish names. Shared by trendingDishes and
    /// discoverDishes. Every failure, including a 402 shelf allowance
    /// refusal, is an empty list: a bonus lookup never shows an error.
    private static func searchDishes(subscriptionID: String, userText: String) async -> [String] {
        let system = """
        You find dishes that are genuinely trending or widely praised online right now.

        Use the web_search tool, at most two searches, to find real dishes people are actually talking about at the moment. Prefer dinners that a home cook could make on a weeknight in 30 to 60 minutes.

        Return JSON only. No prose, no markdown, no backticks. Match this schema exactly:

        {"dishes": ["dish name", "dish name", "dish name"]}

        Between three and five dishes. Each entry is just the dish name, no description, no source, no link.
        """
        do {
            var request = try relayRequest(subscriptionID: subscriptionID, timeout: 75)
            let body: [String: Any] = [
                "model": "claude-sonnet-5",
                // Small on purpose. This call returns a handful of names, so
                // a large budget would only buy a longer wait against the
                // same Cloudflare ceiling this split exists to stay under.
                "max_tokens": 1500,
                "purpose": "discovery",
                "thinking": ["type": "disabled"],
                "system": system,
                "messages": [["role": "user", "content": userText]],
                "webSearch": true
            ]
            request.httpBody = try JSONSerialization.data(withJSONObject: body)

            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                return []
            }
            guard
                let envelope = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                let content = envelope["content"] as? [[String: Any]],
                let textBlock = content.last(where: { ($0["type"] as? String) == "text" }),
                let text = textBlock["text"] as? String
            else {
                return []
            }
            guard
                let json = stripFences(from: text).data(using: .utf8),
                let parsed = try? JSONSerialization.jsonObject(with: json) as? [String: Any],
                let dishes = parsed["dishes"] as? [String]
            else {
                return []
            }
            let cleaned = dishes
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
                .prefix(5)
            return Array(cleaned)
        } catch {
            return []
        }
    }

    // MARK: - Shelf calls

    /// Joins a list for a prompt line; an empty list reads as "none".
    private static func promptList(_ items: [String]) -> String {
        let cleaned = items.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        return cleaned.isEmpty ? "none" : cleaned.joined(separator: ", ")
    }

    /// How many of `count` recipes are the discovery slice. Same rounding as
    /// the contract: round(count * discoveryFraction).
    static func discoverySlice(count: Int, fraction: Double) -> Int {
        min(count, max(0, Int((Double(count) * fraction).rounded())))
    }

    /// What each protein hides in. Prompt wording only; the code-side ban is
    /// ShelfRules.offTerms, which ShelfFiller.validate applies to every recipe.
    private static let proteinDerivatives: [(protein: String, examples: String)] = [
        ("fish", "fish sauce, anchovy, dashi, bonito, and worcestershire sauce"),
        ("shellfish", "oyster sauce, shrimp paste, dried shrimp, and curry pastes made with shrimp"),
        ("pork", "bacon, pancetta, ham, lard, and sausage"),
        ("beef", "beef stock, beef broth, tallow, and demi-glace"),
        ("chicken", "chicken stock, chicken broth, and schmaltz"),
        ("lamb", "lamb stock and lamb fat"),
        ("turkey", "turkey stock and turkey bacon"),
        ("eggs", "mayonnaise, aioli, and egg noodles")
    ]

    /// The derivative ban for the household's off proteins, or nil when none
    /// are off. Names the common derivatives of each off protein it knows.
    static func offProteinDerivativeSentence(_ proteinsOff: [String]) -> String? {
        let off = proteinsOff.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }.filter { !$0.isEmpty }
        guard !off.isEmpty else { return nil }
        let parts = proteinDerivatives.filter { off.contains($0.protein) }.map { "for \($0.protein) that means \($0.examples)" }
        var sentence = "An off protein also bans every sauce, paste, stock, or seasoning made from it"
        if !parts.isEmpty { sentence += ": " + parts.joined(separator: "; ") }
        return sentence + "."
    }

    /// System prompt for the shelf top-up and the fallback dinner. Built per
    /// call because the household's hard rules are restated inside it every
    /// time, in the rules and again right before the schema.
    static func topUpSystemPrompt(signals: ShelfSignals, count: Int, hasTrendingHints: Bool) -> String {
        let discovery = discoverySlice(count: count, fraction: signals.discoveryFraction)
        let taste = count - discovery
        let offProteins = promptList(signals.proteinsOff)
        let offIngredients = promptList(signals.ingredientsOff)
        var hard = "HARD CONSTRAINTS. Never use these proteins: \(offProteins). Never use these ingredients in any form: \(offIngredients). Any recipe that breaks them is discarded."
        // A protein that is off is off in its derivatives too. Without this a
        // fish-off household got fish sauce and oyster sauce in live runs;
        // with it the same prompt came back clean.
        if let derivatives = offProteinDerivativeSentence(signals.proteinsOff) {
            hard += " " + derivatives
        }
        let budget = String(format: "%.2f", signals.perDinnerBudget)
        let ceiling = String(format: "%.2f", signals.perDinnerBudget * ShelfVocab.costCeilingFactor)
        let mix: String
        if discovery == 0 {
            mix = "All \(count) of these should play to the household's known likes."
        } else {
            mix = "About \(discovery) of these should be dishes people are talking about this season, the rest should play to the household's known likes. Mark each recipe's \"slice\" as \"discovery\" for the first kind and \"taste\" for the second."
        }
        let hintsLine = hasTrendingHints
            ? "\n- signals.trendingHints lists dishes found online right now. Build the discovery recipes on those dishes, adapted to the weeknight limits below."
            : ""
        return """
You stock a shelf of dinner recipes for a two-person household. Each recipe will be cooked later, on a weeknight, by a home cook. You will receive a JSON request. Reply with exactly \(count) new recipes.

\(hard)

Rules:
- Every recipe is a real dinner for 2 people, "servings": 2, with a cook time of 30 to 60 minutes.
- \(mix)
- For the discovery recipes, name the trending or viral style dish plainly in the title, then adapt it to a 30 to 60 minute weeknight for two. Never sand it down into a generic version of itself.
- Lean toward what signals.likedCuisines, likedProteins, and likedMethods show the household enjoys. Stay away from signals.dislikedCuisines, dislikedProteins, and dislikedMethods.
- Never repeat or closely rework any title in signals.doNotRepeat, and never repeat a title inside this batch.
- No two recipes in this batch share a cuisine. At most one recipe in this batch has any given primary protein ("none" is exempt). Vary the cooking method across the batch.
- Each recipe's "cuisine" is one of vocab.cuisines, "primaryProtein" is one of vocab.proteins, "method" is one of vocab.methods (the main cooking method), written exactly as listed. Use "none" for protein only when the dish has no meat, fish, egg, tofu, or beans.
- The hard constraints above apply to every field of every recipe: title, ingredients, steps, and grocery lines.
- If the JSON has a "request", it is what the household asked for this dinner. Follow it, unless it breaks a hard constraint.\(hintsLine)
- Every dinner is a complete plate: a protein, a carb or starch side (rice, pasta, potatoes, tortillas, bread, or grains), and a vegetable. The sides are part of the recipe, with their ingredients in the ingredient list, their prep in the steps, and their items on the grocery lines.

Craft. This is what separates a real dinner from filler:
- Build flavor with technique. Sear proteins hard for a crust, build fond in the pan, deglaze it, and finish the sauce in that same pan. Do not boil or steam what should be browned.
- Season in layers as you cook, not once at the end.
- Every plate needs fat and acid balanced against each other. Name the acid explicitly in the ingredients: citrus, vinegar, yogurt, or something pickled.
- Texture contrast is required in every dinner. Something crisp against something soft.
- Respect the ingredient. A simple preparation of something good beats a complicated preparation of something mediocre.
- Regional honesty. If a dish is Vietnamese, use the real aromatics. Never sand a cuisine down into a generic weeknight version of itself.
- Every step states why it matters in one short clause, so the cook learns instead of just obeying. Write "Sear undisturbed 4 minutes so a crust can form" rather than "sear the chicken."
- At least 4 steps and at least 3 ingredients per recipe.

Money:
- The household spends about $\(budget) per dinner. Price each recipe's grocery lines with realistic US supermarket prices for the amount that recipe needs. Keep the sum of the non-pantry lines at or under $\(budget) where a good dinner allows, and never above $\(ceiling).
- Mark "pantry": true on staples a household likely already owns (oil, salt, pepper, dried spices, flour, sugar, common vinegars, soy sauce). Pantry lines still carry the price of buying the item.
- Coverage rule: every ingredient in a recipe's "ingredients" must appear in that same recipe's "groceryItems", as its own line or a clearly matching one (same item, any wording). The household shops from the grocery lines alone, so nothing may be missing. Each grocery "section" is exactly one of vocab.sections.
- "ingredientKeys" is 3 to 8 short lowercase singular names of the main ingredients (for example "pork chop", "apple", "cider vinegar").

\(hard)

Return JSON only. No prose, no markdown, no backticks. Match this schema exactly, with exactly \(count) recipes (\(taste) taste, \(discovery) discovery):

{
  "recipes": [
    { "title": "", "cookTimeMin": 0, "servings": 2,
      "cuisine": "", "primaryProtein": "", "method": "",
      "ingredientKeys": [""],
      "ingredients": [ { "item": "", "qty": "" } ],
      "steps": [ "" ],
      "leftoverYield": false,
      "groceryItems": [ { "section": "Proteins", "name": "", "qty": "", "estPrice": 0.0, "pantry": false } ],
      "slice": "taste" }
  ]
}
"""
    }

    /// The user message for a shelf call: the contract's JSON, with the
    /// optional trendingHints line added to the signals. `request` carries
    /// free text for a fallback dinner.
    private static func topUpUserText(signals: ShelfSignals, count: Int, trendingHints: [String], request: String?) -> String {
        let discovery = discoverySlice(count: count, fraction: signals.discoveryFraction)
        var signalsObject = (try? JSONSerialization.jsonObject(with: JSONEncoder().encode(signals))) as? [String: Any] ?? [:]
        // Doubles encode with their binary tail (0.3 becomes 0.29999999999999999).
        // Round to what means something and send exact decimals.
        signalsObject["discoveryFraction"] = NSDecimalNumber(string: String(format: "%.1f", signals.discoveryFraction))
        signalsObject["perDinnerBudget"] = NSDecimalNumber(string: String(format: "%.2f", signals.perDinnerBudget))
        let hints = trendingHints.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        if !hints.isEmpty {
            signalsObject["trendingHints"] = hints
        }
        var object: [String: Any] = [
            "task": "shelf_topup",
            "count": count,
            "slices": ["taste": count - discovery, "discovery": discovery],
            "servings": 2,
            "vocab": [
                "cuisines": ShelfVocab.cuisines,
                "proteins": ShelfVocab.proteins,
                "methods": ShelfVocab.methods,
                "sections": ShelfVocab.sections
            ],
            "signals": signalsObject
        ]
        if let request = request?.trimmingCharacters(in: .whitespacesAndNewlines), !request.isEmpty {
            object["request"] = request
        }
        let data = (try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])) ?? Data("{}".utf8)
        return String(data: data, encoding: .utf8) ?? "{}"
    }

    /// One shelf request through the relay with the given purpose. Returns
    /// the last text block of the reply. 402 throws outOfPlans, 401 throws
    /// subscriptionRefused, everything else non-200 throws badStatus; the
    /// callers decide which of those the household ever sees.
    private static func shelfCall(purpose: String, system: String, userText: String, maxTokens: Int, timeout: TimeInterval, subscriptionID: String?) async throws -> String {
        guard let subscriptionID, !subscriptionID.isEmpty else {
            throw ClaudeError.subscriptionRefused
        }
        var request = try relayRequest(subscriptionID: subscriptionID, timeout: timeout)
        let body: [String: Any] = [
            "model": "claude-sonnet-5",
            "max_tokens": maxTokens,
            "purpose": purpose,
            "thinking": ["type": "disabled"],
            "system": system,
            "messages": [["role": "user", "content": userText]]
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        logLongText("outgoing \(purpose) system prompt", system)
        logLongText("outgoing \(purpose) user text", userText)
        logger.info("Shelf request out: purpose \(purpose, privacy: .public), \(userText.count, privacy: .public) chars of user text, timeout \(Int(timeout), privacy: .public)s.")

        let started = Date()
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            let elapsed = Int(Date().timeIntervalSince(started))
            logger.error("Shelf \(purpose, privacy: .public) transport failure after \(elapsed, privacy: .public)s: \(String(describing: error), privacy: .public)")
            throw error
        }
        let elapsed = Int(Date().timeIntervalSince(started))
        guard let http = response as? HTTPURLResponse else {
            throw ClaudeError.badStatus(0, "No HTTP response.")
        }
        logger.info("Relay answered \(http.statusCode, privacy: .public) to a \(purpose, privacy: .public) request in \(elapsed, privacy: .public)s with \(data.count, privacy: .public) bytes.")
        guard http.statusCode == 200 else {
            let snippet = String(String(data: data, encoding: .utf8)?.prefix(300) ?? "")
            switch http.statusCode {
            case 402: throw ClaudeError.outOfPlans(snippet)
            case 401: throw ClaudeError.subscriptionRefused
            default: throw ClaudeError.badStatus(http.statusCode, snippet)
            }
        }
        guard
            let envelope = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let content = envelope["content"] as? [[String: Any]],
            let textBlock = content.last(where: { ($0["type"] as? String) == "text" }),
            let text = textBlock["text"] as? String,
            !text.isEmpty
        else {
            throw ClaudeError.emptyReply
        }
        return text
    }

    /// Asks for `count` new shelf recipes (purpose "topup", no web search).
    /// Returns the recipes that decoded; one malformed recipe is skipped, not
    /// the batch. The caller validates content against the household's rules.
    ///
    /// A 402 means the monthly shelf allowance is used up. That is not
    /// something to tell anyone about, so it returns an empty list instead
    /// of throwing. Other failures throw.
    ///
    /// trendingHints (dish names from discoverDishes) and retryNotes
    /// (rejection reasons from a failed first pass) extend the prompt; the
    /// frozen ShelfSignals type is left alone.
    static func topUp(signals: ShelfSignals, count: Int, subscriptionID: String?, trendingHints: [String] = [], retryNotes: [String] = []) async throws -> [ShelfTopUpRecipe] {
        let n = min(max(count, 1), 5)
        let hints = trendingHints.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        let system = topUpSystemPrompt(signals: signals, count: n, hasTrendingHints: !hints.isEmpty)
        var userText = topUpUserText(signals: signals, count: n, trendingHints: hints, request: nil)
        if !retryNotes.isEmpty {
            userText += "\n\nThe previous batch was thrown out for these reasons. Fix every one of them and return a fresh batch: \(retryNotes.joined(separator: " "))"
        }
        do {
            let text = try await shelfCall(purpose: "topup", system: system, userText: userText, maxTokens: 12000, timeout: 120, subscriptionID: subscriptionID)
            guard
                let json = stripFences(from: text).data(using: .utf8),
                let decoded = try? JSONDecoder().decode(ShelfTopUpResponse.self, from: json)
            else {
                logger.error("Top-up JSON failed to decode. Reply starts: \(String(text.prefix(300)), privacy: .private)")
                throw ClaudeError.parseFailed
            }
            let good = decoded.recipes.compactMap { $0 }
            if good.count < decoded.recipes.count {
                logger.warning("Top-up: \(decoded.recipes.count - good.count, privacy: .public) of \(decoded.recipes.count, privacy: .public) recipes did not decode and were skipped.")
            }
            return good
        } catch ClaudeError.outOfPlans {
            logger.info("Top-up refused with 402 (shelf allowance used). Staying silent.")
            return []
        }
    }

    /// One replacement dinner in top-up shape, for a night the shelf cannot
    /// fill (purpose "swap", so it counts with plans and swaps). `request` is
    /// the household's own words for the swap, if they said any. The caller
    /// validates it like any other top-up recipe. Throws on failure,
    /// parseFailed when no recipe decoded.
    static func fallbackDinner(signals: ShelfSignals, request: String?, subscriptionID: String?) async throws -> ShelfTopUpRecipe {
        var oneOff = signals
        oneOff.discoveryFraction = 0
        let system = topUpSystemPrompt(signals: oneOff, count: 1, hasTrendingHints: false)
        let userText = topUpUserText(signals: oneOff, count: 1, trendingHints: [], request: request)
        let text = try await shelfCall(purpose: "swap", system: system, userText: userText, maxTokens: 2500, timeout: 90, subscriptionID: subscriptionID)
        guard
            let json = stripFences(from: text).data(using: .utf8),
            let decoded = try? JSONDecoder().decode(ShelfTopUpResponse.self, from: json),
            let first = decoded.recipes.compactMap({ $0 }).first
        else {
            logger.error("Fallback dinner JSON failed to decode. Reply starts: \(String(text.prefix(300)), privacy: .private)")
            throw ClaudeError.parseFailed
        }
        return first
    }

    private static func requestPlan(userText: String, dinners: Int, subscriptionID: String, useWebSearch: Bool = false, purpose: String = "plan") async throws -> MealPlan {
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

        let system = systemPrompt(dinners: dinners, webSearchEnabled: useWebSearch)
        var body: [String: Any] = [
            "model": "claude-sonnet-5",
            // Room for a full week: up to 7 recipes with ingredients and
            // steps, plus the grocery list. 8000 could clip a verbose plan
            // mid-JSON.
            "max_tokens": 16000,
            // Which relay counter and token ceiling this request belongs to.
            // The Worker refuses unknown values by name, so only the five it
            // lists are ever sent: plan, swap, topup, discovery, import.
            "purpose": purpose,
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
            "system": system,
            "messages": [
                ["role": "user", "content": userText]
            ]
        ]
        // The Worker decides what tool this actually attaches; this flag is
        // just the ask. See Proxy/worker.js's WEB_SEARCH_TOOL.
        if useWebSearch {
            body["webSearch"] = true
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        // The full outgoing prompt, so a drifting plan can be checked against
        // what actually went out instead of what the code was believed to
        // send. Chunked because Console truncates long single lines.
        logLongText("outgoing system prompt", system)
        logLongText("outgoing user text", userText)
        logger.info("Plan request out: purpose \(purpose, privacy: .public), \(userText.count, privacy: .public) chars of user text, \(dinners, privacy: .public) dinners, webSearch \(useWebSearch, privacy: .public), timeout \(Int(request.timeoutInterval), privacy: .public)s.")

        let started = Date()
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            // The swap bug hid here for a while: a hung or failed call left
            // nothing behind to diagnose. Every transport failure now names
            // itself and how long it took before anything else handles it.
            let elapsed = Int(Date().timeIntervalSince(started))
            logger.error("Plan request transport failure after \(elapsed, privacy: .public)s: \(String(describing: error), privacy: .public)")
            throw error
        }
        let elapsed = Int(Date().timeIntervalSince(started))
        guard let http = response as? HTTPURLResponse else {
            logger.error("Plan request got a non-HTTP response after \(elapsed, privacy: .public)s.")
            throw ClaudeError.badStatus(0, "No HTTP response.")
        }
        logger.info("Relay answered \(http.statusCode, privacy: .public) in \(elapsed, privacy: .public)s with \(data.count, privacy: .public) bytes.")
        guard http.statusCode == 200 else {
            let snippet = String(data: data, encoding: .utf8)?.prefix(300) ?? ""
            logger.error("Relay refused with status \(http.statusCode, privacy: .public): \(String(snippet), privacy: .public)")
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

        // Pull the LAST text block out of the reply, not the first. Claude
        // can include a preamble text block before a web_search_tool_result
        // block when web search is enabled, with the actual JSON answer in a
        // text block after the search results; taking the first block would
        // grab that preamble instead of the plan.
        guard
            let envelope = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let content = envelope["content"] as? [[String: Any]],
            let textBlock = content.last(where: { ($0["type"] as? String) == "text" }),
            let text = textBlock["text"] as? String,
            !text.isEmpty
        else {
            logger.error("Relay 200 carried no text block. Envelope was \(data.count, privacy: .public) bytes.")
            throw ClaudeError.emptyReply
        }

        let cleaned = stripFences(from: text)
        guard
            let planData = cleaned.data(using: .utf8),
            let plan = try? JSONDecoder().decode(MealPlan.self, from: planData)
        else {
            logger.error("Plan JSON failed to decode. Reply starts: \(String(cleaned.prefix(300)), privacy: .private)")
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
            logger.error("Plan decoded but incomplete: \(plan.week.count, privacy: .public) days, \(plan.recipes.count, privacy: .public) recipes.")
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
