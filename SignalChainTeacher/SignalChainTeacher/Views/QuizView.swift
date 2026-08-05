import SwiftUI
import SwiftData

struct QuizView: View {
    @Query(sort: \QuizCard.sortOrder) private var cards: [QuizCard]
    @Environment(\.modelContext) private var context
    @State private var index = 0
    @State private var isRevealed = false
    @State private var showFreeform = false

    private var card: QuizCard? {
        guard cards.indices.contains(index) else { return nil }
        return cards[index]
    }

    var body: some View {
        VStack(spacing: 24) {
            Text("Cue Vocabulary")
                .font(Theme.displayFont(26))

            if let card {
                VStack(spacing: 16) {
                    Text("\(index + 1) of \(cards.count)")
                        .font(Theme.statFont(11))
                        .foregroundStyle(.secondary)

                    VStack(spacing: 14) {
                        Text(card.filmMoment)
                            .font(Theme.displayFont(22))
                            .multilineTextAlignment(.center)

                        if isRevealed {
                            VStack(spacing: 6) {
                                Text(card.moduleName)
                                    .font(Theme.statFont(13))
                                    .foregroundStyle(Theme.brass)
                                Text(card.technique)
                                    .font(.body)
                                    .multilineTextAlignment(.center)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .frame(maxWidth: 420, minHeight: 160)
                    .padding(24)
                    .background(RoundedRectangle(cornerRadius: 14).fill(.black.opacity(0.2)))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.cardStroke))
                    .onTapGesture { isRevealed.toggle() }

                    HStack(spacing: 16) {
                        Button("Previous") { step(-1) }.disabled(index == 0)
                        Toggle("Learned", isOn: Binding(
                            get: { card.isLearned },
                            set: { card.isLearned = $0; try? context.save() }
                        ))
                        .toggleStyle(.switch)
                        Button("Next") { step(1) }.disabled(index == cards.count - 1)
                    }
                }
            }

            Divider().frame(maxWidth: 420)

            Button("Describe a film moment") { showFreeform = true }
                .buttonStyle(.borderedProminent)
                .tint(Theme.brass)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .sheet(isPresented: $showFreeform) {
            FreeformTeacherSheet()
        }
    }

    private func step(_ delta: Int) {
        index = max(0, min(cards.count - 1, index + delta))
        isRevealed = false
    }
}
