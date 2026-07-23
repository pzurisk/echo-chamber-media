import Foundation

/// Calls the Anthropic Messages API and turns a voice transcript into a MealPlan.
///
/// Two modes, chosen at build time from the gitignored Secrets.xcconfig:
/// - Proxy mode: if CLAUDE_PROXY_URL is set in Info.plist, requests go to the
///   Cloudflare Worker relay (see Proxy/README.md). The Anthropic key lives
///   server side and no key ships on the device. An optional CLAUDE_PROXY_TOKEN
///   is sent as the x-app-token header so only the app can use the relay.
/// - Direct mode: if no proxy is configured, the app calls api.anthropic.com
///   with the embedded ANTHROPIC_API_KEY from Info.plist, as before.
enum ClaudeService {

    enum ClaudeError: LocalizedError {
        case missingKey
        case badStatus(Int, String)
        case emptyReply
        case parseFailed

        var errorDescription: String? {
            switch self {
            case .missingKey:
                return "No API key found. Add ANTHROPIC_API_KEY (or CLAUDE_PROXY_URL for the relay) to Secrets.xcconfig and rebuild."
            case .badStatus(let code, let body):
                return "The planning service returned an error (\(code)). \(body)"
            case .emptyReply:
                return "The planning service sent back an empty reply. Try again."
            case .parseFailed:
                return "Could not read the meal plan. Try again."
            }
        }
    }

    // MARK: - Runtime system prompt (embedded verbatim)

    static let systemPrompt = """
You plan weekly dinners for a two-person household, Billy and Melissa. You will receive a short, possibly messy voice transcript of cravings, proteins, or dish ideas. Build a full 5-dinner plan, Monday through Friday, around whatever they mention, and fill the remaining nights yourself with dinners that fit.

Rules:
- Bold, global flavors. Cook time 30 to 60 minutes per meal.
- Maximize ingredient overlap. Reuse a small shared pool of pantry staples across the week to cut cost and waste.
- Cook for 2 people, leftovers fine.
- Respect the weekly budget target passed in the transcript context. Estimate realistic US grocery prices. Mark staples the household likely already owns as pantry items and subtract their cost. Report the estimated total and whether it is under or over target.
- Consolidate duplicate ingredients across recipes into one grocery entry with the quantities summed.

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
      { "name": "Proteins", "items": [ { "name": "", "qty": "", "estPrice": 0.0, "pantry": false } ] }
    ]
  }
}

week and recipes each have exactly 5 entries, one per weekday, in order. grocery.sections use only these names when relevant: Proteins, Produce, Pantry, Dairy, Bread, Sauces.
"""

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
    /// They go into the user context only; the system prompt never changes.
    static func planWeek(transcript: String, budget: Double, dinners: Int, tasteNotes: String = "", lockedRecipes: [Recipe] = []) async throws -> MealPlan {
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
            return try await requestPlan(userText: context)
        } catch ClaudeError.parseFailed {
            let reminder = context + "\n\nReminder: return only valid JSON matching the schema. No prose, no markdown, no backticks."
            return try await requestPlan(userText: reminder)
        } catch let error as URLError where Self.transientURLErrorCodes.contains(error.code) {
            try await Task.sleep(nanoseconds: 2_000_000_000)
            return try await requestPlan(userText: context)
        } catch ClaudeError.badStatus(let code, _) where (500...599).contains(code) {
            try await Task.sleep(nanoseconds: 2_000_000_000)
            return try await requestPlan(userText: context)
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

    private static func requestPlan(userText: String) async throws -> MealPlan {
        var request: URLRequest
        if let proxyString = configValue("CLAUDE_PROXY_URL"),
           let proxyURL = URL(string: proxyString) {
            // Proxy mode. The Worker holds the Anthropic key server side and
            // relays the response verbatim, so no key is needed on the device.
            request = URLRequest(url: proxyURL)
            if let token = configValue("CLAUDE_PROXY_TOKEN") {
                request.setValue(token, forHTTPHeaderField: "x-app-token")
            }
        } else {
            // Direct mode. Requires the embedded API key, exactly as before.
            guard let key = configValue("ANTHROPIC_API_KEY") else {
                throw ClaudeError.missingKey
            }
            request = URLRequest(url: URL(string: "https://api.anthropic.com/v1/messages")!)
            request.setValue(key, forHTTPHeaderField: "x-api-key")
        }
        request.httpMethod = "POST"
        // Planning a full week can take a while. Give the model room.
        request.timeoutInterval = 240
        // Note: the API version header is 2023-06-01. That value is the
        // current, correct one for the Messages API. The proxy forwards it.
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        request.setValue("application/json", forHTTPHeaderField: "content-type")

        let body: [String: Any] = [
            "model": "claude-sonnet-5",
            "max_tokens": 8000,
            "system": systemPrompt,
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
            throw ClaudeError.badStatus(http.statusCode, String(snippet))
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
