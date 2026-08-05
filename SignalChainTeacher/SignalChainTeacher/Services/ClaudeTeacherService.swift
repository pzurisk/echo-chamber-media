import Foundation

/// Calls the Anthropic Messages API in character as Billy's film-scoring
/// and analog synth mentor. Model id is claude-sonnet-5, current as of this
/// build; reverify against docs.claude.com before shipping, since these
/// change.
enum ClaudeTeacherService {

    enum TeacherError: LocalizedError {
        case missingKey
        case badStatus(Int, String)
        case emptyReply

        var errorDescription: String? {
            switch self {
            case .missingKey:
                return "No Anthropic API key is stored yet. Add one in Settings."
            case .badStatus(let code, _):
                switch code {
                case 401, 403:
                    return "The API key was rejected. Check it in Settings."
                case 429:
                    return "Rate limited. Wait a moment and try again."
                case 500...599:
                    return "Anthropic's API had a hiccup. Try again."
                default:
                    return "Could not reach the API."
                }
            case .emptyReply:
                return "Got an empty reply. Try again."
            }
        }
    }

    enum ObjectiveStatus {
        case met, partial, notMet
    }

    struct ObjectiveReply {
        let message: String
        let status: ObjectiveStatus
    }

    /// Billy's actual gear, so the teacher never suggests hardware he does
    /// not have.
    private static let gearList = """
    Behringer Model D, Moog Mother-32, Moog DFAM, Moog Subharmonicon, \
    Moog Nightfall. Recorded through an Apollo x4.
    """

    private static let personaHeader = """
    You are an experienced film composer and analog synth mentor, teaching \
    Billy his five-piece rig for film scoring: \(gearList)

    Be direct. No filler, no encouragement for its own sake. Give one \
    concrete next step per response. Three to five sentences typical, never \
    a wall of text. Never use em dashes, use a period or comma instead. \
    Never suggest hardware outside the gear list above.
    """

    // MARK: - Objective evaluation

    static func evaluate(
        objectiveText: String,
        moduleFocus: String,
        userInput: String,
        priorExchanges: [TeacherExchange]
    ) async throws -> ObjectiveReply {
        let system = """
        \(personaHeader)

        Billy is working on this objective: "\(objectiveText)"
        Module focus: \(moduleFocus)

        Judge only whether what he describes satisfies the objective. End \
        your reply with exactly one of these tags on its own line, nothing \
        after it: [STATUS: MET] if the objective is genuinely satisfied, \
        [STATUS: PARTIAL] if he's close but missing something, or \
        [STATUS: NOT MET] if it does not yet address the objective.
        """

        var context = "What Billy patched: \(userInput)"
        if !priorExchanges.isEmpty {
            let history = priorExchanges
                .sorted(by: { $0.timestamp < $1.timestamp })
                .suffix(3)
                .map { "- Tried: \($0.userInput) -> You said: \($0.teacherResponse)" }
                .joined(separator: "\n")
            context = "Prior attempts on this objective:\n\(history)\n\nLatest: \(userInput)"
        }

        let raw = try await send(system: system, userText: context)
        return parseObjectiveReply(raw)
    }

    private static func parseObjectiveReply(_ raw: String) -> ObjectiveReply {
        let statusMarkers: [(String, ObjectiveStatus)] = [
            ("[STATUS: MET]", .met),
            ("[STATUS: PARTIAL]", .partial),
            ("[STATUS: NOT MET]", .notMet)
        ]
        var status: ObjectiveStatus = .notMet
        var message = raw
        for (marker, value) in statusMarkers {
            if let range = message.range(of: marker) {
                status = value
                message.removeSubrange(range)
                break
            }
        }
        return ObjectiveReply(
            message: message.trimmingCharacters(in: .whitespacesAndNewlines),
            status: status
        )
    }

    // MARK: - Freeform cue suggestion

    static func suggestTechnique(forFilmMoment description: String) async throws -> String {
        let system = """
        \(personaHeader)

        Billy will describe a moment from a film in his own words. Suggest \
        which module fits best and what to actually patch or set, drawing \
        on how tension, texture, dissonance, and release work in scoring. \
        Ground the suggestion in the gear list, not general music theory \
        jargon.
        """
        return try await send(system: system, userText: description)
    }

    // MARK: - Request plumbing

    private static func send(system: String, userText: String) async throws -> String {
        guard let key = KeychainService.loadAPIKey(), !key.isEmpty else {
            throw TeacherError.missingKey
        }

        var request = URLRequest(url: URL(string: "https://api.anthropic.com/v1/messages")!)
        request.httpMethod = "POST"
        request.timeoutInterval = 60
        request.setValue(key, forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        request.setValue("application/json", forHTTPHeaderField: "content-type")

        let body: [String: Any] = [
            "model": "claude-sonnet-5",
            "max_tokens": 400,
            "thinking": ["type": "disabled"],
            "system": system,
            "messages": [
                ["role": "user", "content": userText]
            ]
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw TeacherError.badStatus(0, "No HTTP response.")
        }
        guard http.statusCode == 200 else {
            let snippet = String(data: data, encoding: .utf8)?.prefix(300) ?? ""
            throw TeacherError.badStatus(http.statusCode, String(snippet))
        }

        guard
            let envelope = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let content = envelope["content"] as? [[String: Any]],
            let textBlock = content.first(where: { ($0["type"] as? String) == "text" }),
            let text = textBlock["text"] as? String,
            !text.isEmpty
        else {
            throw TeacherError.emptyReply
        }
        return text
    }
}
