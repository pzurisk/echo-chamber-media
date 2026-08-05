import SwiftUI
import SwiftData

struct FreeformTeacherSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \QuizExchange.timestamp, order: .reverse) private var history: [QuizExchange]

    @State private var description = ""
    @State private var isSending = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Describe a film moment").font(Theme.displayFont(20))
            Text("Type the scene or feeling you're scoring for, in your own words.")
                .font(.caption).foregroundStyle(.secondary)

            TextEditor(text: $description)
                .frame(height: 90)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(Theme.cardStroke))
                .disabled(isSending)

            if let errorMessage {
                Text(errorMessage).font(.caption).foregroundStyle(.red)
            }

            if !history.isEmpty {
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(history) { exchange in
                            VStack(alignment: .leading, spacing: 3) {
                                Text(exchange.userDescription).font(.caption).bold()
                                Text(exchange.teacherSuggestion).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .frame(maxHeight: 180)
            }

            HStack {
                Button("Close") { dismiss() }
                Spacer()
                Button {
                    Task { await send() }
                } label: {
                    if isSending {
                        ProgressView().controlSize(.small)
                    } else {
                        Text("Ask")
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.brass)
                .disabled(description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSending)
            }
        }
        .padding(24)
        .frame(width: 460)
    }

    private func send() async {
        let text = description.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        isSending = true
        errorMessage = nil
        defer { isSending = false }

        do {
            let suggestion = try await ClaudeTeacherService.suggestTechnique(forFilmMoment: text)
            let exchange = QuizExchange(userDescription: text, teacherSuggestion: suggestion, timestamp: Date())
            context.insert(exchange)
            try? context.save()
            description = ""
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
