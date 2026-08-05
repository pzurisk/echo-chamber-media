import SwiftUI
import SwiftData

struct AskTeacherSheet: View {
    let module: Module
    @Bindable var objective: Objective
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var input = ""
    @State private var isSending = false
    @State private var lastReply: ClaudeTeacherService.ObjectiveReply?
    @State private var errorMessage: String?

    private var accentColor: Color { Color(hex: module.accentColorHex) }

    private var priorExchanges: [TeacherExchange] {
        module.exchanges.filter { $0.objectiveID == objective.id }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Ask the teacher").font(Theme.displayFont(20))
                Text(objective.text).font(.callout).foregroundStyle(.secondary)
            }

            if !priorExchanges.isEmpty {
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(priorExchanges.sorted(by: { $0.timestamp < $1.timestamp })) { exchange in
                            VStack(alignment: .leading, spacing: 3) {
                                Text(exchange.userInput).font(.caption).bold()
                                Text(exchange.teacherResponse).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .frame(maxHeight: 120)
            }

            Text("What did you patch?")
                .font(.caption).foregroundStyle(.secondary)
            TextEditor(text: $input)
                .frame(height: 90)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(Theme.cardStroke))
                .disabled(isSending)

            if let reply = lastReply {
                VStack(alignment: .leading, spacing: 6) {
                    Text(reply.message)
                    statusBadge(for: reply.status)
                }
                .padding(12)
                .background(RoundedRectangle(cornerRadius: 8).fill(accentColor.opacity(0.12)))
            }

            if let errorMessage {
                Text(errorMessage).font(.caption).foregroundStyle(.red)
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
                        Text("Send")
                    }
                }
                .keyboardShortcut(.return, modifiers: .command)
                .buttonStyle(.borderedProminent)
                .tint(accentColor)
                .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSending)
            }
        }
        .padding(24)
        .frame(width: 460)
    }

    @ViewBuilder
    private func statusBadge(for status: ClaudeTeacherService.ObjectiveStatus) -> some View {
        switch status {
        case .met:
            Label("Objective met, marked complete", systemImage: "checkmark.circle.fill")
                .font(.caption).foregroundStyle(.green)
        case .partial:
            Label("Partially there", systemImage: "circle.lefthalf.filled")
                .font(.caption).foregroundStyle(.yellow)
        case .notMet:
            Label("Not yet", systemImage: "circle")
                .font(.caption).foregroundStyle(.secondary)
        }
    }

    private func send() async {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        isSending = true
        errorMessage = nil
        defer { isSending = false }

        do {
            let reply = try await ClaudeTeacherService.evaluate(
                objectiveText: objective.text,
                moduleFocus: module.focus,
                userInput: text,
                priorExchanges: priorExchanges
            )
            lastReply = reply

            let exchange = TeacherExchange(
                objectiveID: objective.id,
                userInput: text,
                teacherResponse: reply.message,
                markedObjectiveComplete: reply.status == .met,
                timestamp: Date()
            )
            exchange.module = module
            context.insert(exchange)

            if reply.status == .met {
                objective.isComplete = true
                objective.completedVia = .teacher
            }
            try? context.save()
            input = ""
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
