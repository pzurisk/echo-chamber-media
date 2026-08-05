import SwiftUI
import SwiftData

struct ModuleDetailView: View {
    @Bindable var module: Module
    @Environment(\.modelContext) private var context
    @State private var teacherObjective: Objective?

    private var panelColor: Color { Color(hex: module.panelColorHex) }
    private var accentColor: Color { Color(hex: module.accentColorHex) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                progressBar
                VStack(spacing: 10) {
                    ForEach(module.objectives.sorted(by: { $0.sortOrder < $1.sortOrder })) { objective in
                        ObjectiveRow(
                            objective: objective,
                            accentColor: accentColor,
                            ledColor: Color(hex: module.ledColorHex),
                            onToggleManual: { toggleManual(objective) },
                            onAskTeacher: { teacherObjective = objective }
                        )
                    }
                }
            }
            .padding(28)
        }
        .background(panelColor.opacity(0.15))
        .navigationTitle(module.device)
        .sheet(item: $teacherObjective) { objective in
            AskTeacherSheet(module: module, objective: objective)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(module.tag.uppercased())
                .font(Theme.statFont(12))
                .foregroundStyle(accentColor)
            Text(module.name)
                .font(Theme.displayFont(28))
            Text(module.focus)
                .font(.body)
                .foregroundStyle(.secondary)
        }
    }

    private var progressBar: some View {
        VStack(alignment: .leading, spacing: 6) {
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.08))
                    Capsule().fill(accentColor)
                        .frame(width: proxy.size.width * module.completionFraction)
                }
            }
            .frame(height: 8)
            Text("\(module.objectives.filter(\.isComplete).count) of \(module.objectives.count) objectives complete")
                .font(Theme.statFont(11))
                .foregroundStyle(.secondary)
        }
    }

    private func toggleManual(_ objective: Objective) {
        objective.isComplete.toggle()
        objective.completedVia = objective.isComplete ? .manual : nil
        try? context.save()
    }
}

private struct ObjectiveRow: View {
    @Bindable var objective: Objective
    let accentColor: Color
    let ledColor: Color
    let onToggleManual: () -> Void
    let onAskTeacher: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Button(action: onToggleManual) {
                Circle()
                    .strokeBorder(objective.isComplete ? ledColor : Color.secondary, lineWidth: 2)
                    .background(Circle().fill(objective.isComplete ? ledColor.opacity(0.85) : .clear))
                    .frame(width: 20, height: 20)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 4) {
                Text(objective.text)
                    .strikethrough(objective.isComplete)
                    .foregroundStyle(objective.isComplete ? .secondary : .primary)
                if objective.completedVia == .teacher {
                    Label("Confirmed by the teacher", systemImage: "sparkles")
                        .font(.caption2)
                        .foregroundStyle(accentColor)
                }
            }

            Spacer()

            Button("Ask the teacher", action: onAskTeacher)
                .buttonStyle(.bordered)
                .tint(accentColor)
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 10).fill(.black.opacity(0.15)))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.cardStroke, lineWidth: 1))
    }
}
