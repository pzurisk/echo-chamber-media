import SwiftUI
import SwiftData

@main
struct SignalChainTeacherApp: App {
    let container: ModelContainer

    init() {
        do {
            container = try ModelContainer(for: Module.self, Objective.self, TeacherExchange.self,
                                            QuizCard.self, QuizExchange.self, UserProgress.self)
        } catch {
            fatalError("Could not create SwiftData container: \(error)")
        }
        SeedContent.seedIfNeeded(context: container.mainContext)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(container)
        .defaultSize(width: 1100, height: 720)
        .commands {
            CommandGroup(replacing: .newItem) {}
        }
    }
}
