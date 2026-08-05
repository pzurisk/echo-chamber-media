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

    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                Section("The Rack") {
                    ForEach(modules) { module in
                        ModuleRow(module: module)
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
                XPFooter(userProgress: currentProgress)
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
            recalculateXP()
            if selection == nil, let last = progress.first?.lastOpenedModuleID,
               modules.contains(where: { $0.id == last }) {
                selection = .module(last)
            }
        }
        .onChange(of: selection) { _, newValue in
            if case .module(let id) = newValue {
                currentProgress.lastOpenedModuleID = id
                try? context.save()
            }
        }
    }

    private var currentProgress: UserProgress {
        if let existing = progress.first { return existing }
        let created = UserProgress(totalXP: 0, currentLevel: XPCalculator.levelName(forXP: 0))
        context.insert(created)
        return created
    }

    /// Recomputes XP/level and unlock state from scratch. Cheap at this
    /// scale (five modules, ~25 objectives, 12 quiz cards) so it is simplest
    /// to just rerun it whenever the rack view appears rather than track
    /// incremental deltas.
    func recalculateXP() {
        let progress = currentProgress
        progress.totalXP = XPCalculator.totalXP(modules: modules, quizCards: quizCards)
        progress.currentLevel = XPCalculator.levelName(forXP: progress.totalXP)

        let ordered = modules.sorted(by: { $0.sortOrder < $1.sortOrder })
        for (index, module) in ordered.enumerated() {
            if index == 0 {
                module.isUnlocked = true
            } else {
                module.isUnlocked = ordered[index - 1].isFullyComplete
            }
        }
        try? context.save()
    }
}

private struct ModuleRow: View {
    let module: Module

    var body: some View {
        HStack(spacing: 10) {
            Circle()
                .fill(module.isUnlocked ? Color(hex: module.ledColorHex) : Color.gray.opacity(0.4))
                .frame(width: 8, height: 8)
            VStack(alignment: .leading, spacing: 2) {
                Text(module.tag).font(.caption).foregroundStyle(.secondary)
                Text(module.device).font(Theme.displayFont(14))
            }
            Spacer()
            if module.isUnlocked {
                Text("\(Int(module.completionFraction * 100))%")
                    .font(Theme.statFont(11))
                    .foregroundStyle(Color(hex: module.accentColorHex))
            } else {
                Image(systemName: "lock.fill").font(.caption2).foregroundStyle(.secondary)
            }
        }
        .opacity(module.isUnlocked ? 1 : 0.5)
    }
}

private struct XPFooter: View {
    @Bindable var userProgress: UserProgress

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(userProgress.currentLevel)
                .font(Theme.displayFont(13))
                .foregroundStyle(Theme.brass)
            Text("\(userProgress.totalXP) XP")
                .font(Theme.statFont(11))
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.ultraThinMaterial)
    }
}
