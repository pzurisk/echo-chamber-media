import SwiftUI
import SwiftData

enum Destination: Hashable {
    case module(String)
    case quiz
    case settings
}

struct RootView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Module.sortOrder) private var modules: [Module]
    @Query private var quizCards: [QuizCard]
    @Query private var progress: [UserProgress]
    @State private var selection: Destination?

    /// Computed live from the source data on every render, not cached, so
    /// XP and unlock state can never go stale after an objective completes
    /// somewhere else in the app. SwiftData's Observation tracks the
    /// `isComplete`/`isLearned` reads inside these and re-renders RootView
    /// automatically when any of them change.
    private var totalXP: Int {
        XPCalculator.totalXP(modules: modules, quizCards: quizCards)
    }

    private var levelName: String {
        XPCalculator.levelName(forXP: totalXP)
    }

    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                Section("The Rack") {
                    ForEach(modules) { module in
                        ModuleRow(module: module, isUnlocked: Module.isUnlocked(module, orderedModules: modules))
                            .tag(Destination.module(module.id))
                    }
                }
                Section("Study") {
                    Label("Cue Vocabulary", systemImage: "music.quarternote.3")
                        .tag(Destination.quiz)
                }
            }
            .listStyle(.sidebar)
            .navigationTitle("Signal Chain")
            .toolbar {
                ToolbarItem(placement: .automatic) {
                    Button {
                        selection = .settings
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                XPFooter(levelName: levelName, totalXP: totalXP)
            }
        } detail: {
            switch selection {
            case .module(let id):
                if let module = modules.first(where: { $0.id == id }) {
                    ModuleDetailView(module: module)
                } else {
                    ContentUnavailableView("Module not found", systemImage: "questionmark.square.dashed")
                }
            case .quiz:
                QuizView()
            case .settings:
                SettingsView()
            case nil:
                ContentUnavailableView("Pick a module", systemImage: "waveform.path.ecg", description: Text("Choose a piece of the rack from the sidebar to see today's objectives."))
            }
        }
        .background(Theme.rackBackground)
        .task {
            ensureUserProgressExists()
            if selection == nil, let last = progress.first?.lastOpenedModuleID,
               modules.contains(where: { $0.id == last }) {
                selection = .module(last)
            }
        }
        .onChange(of: selection) { _, newValue in
            guard case .module(let id) = newValue else { return }
            ensureUserProgressExists()
            progress.first?.lastOpenedModuleID = id
            try? context.save()
        }
    }

    /// Runs from `.task` and `onChange`, both async/event contexts, never
    /// from `body` itself, so inserting here never risks mutating state
    /// mid view-update.
    private func ensureUserProgressExists() {
        guard progress.isEmpty else { return }
        context.insert(UserProgress())
        try? context.save()
    }
}

private struct ModuleRow: View {
    let module: Module
    let isUnlocked: Bool

    var body: some View {
        HStack(spacing: 10) {
            Circle()
                .fill(isUnlocked ? Color(hex: module.ledColorHex) : Color.gray.opacity(0.4))
                .frame(width: 8, height: 8)
            VStack(alignment: .leading, spacing: 2) {
                Text(module.tag).font(.caption).foregroundStyle(.secondary)
                Text(module.device).font(Theme.displayFont(14))
            }
            Spacer()
            if isUnlocked {
                Text("\(Int(module.completionFraction * 100))%")
                    .font(Theme.statFont(11))
                    .foregroundStyle(Color(hex: module.accentColorHex))
            } else {
                Image(systemName: "lock.fill").font(.caption2).foregroundStyle(.secondary)
            }
        }
        .opacity(isUnlocked ? 1 : 0.5)
    }
}

private struct XPFooter: View {
    let levelName: String
    let totalXP: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(levelName)
                .font(Theme.displayFont(13))
                .foregroundStyle(Theme.brass)
            Text("\(totalXP) XP")
                .font(Theme.statFont(11))
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.ultraThinMaterial)
    }
}
