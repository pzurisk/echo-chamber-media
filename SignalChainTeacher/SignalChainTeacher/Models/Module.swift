import Foundation
import SwiftData

/// One of the five rig pieces (or the Day 5 full-rig session). Order and
/// unlock state follow the curriculum's day sequence: a module unlocks once
/// the previous one's objectives are all complete.
@Model
final class Module {
    @Attribute(.unique) var id: String
    var device: String
    var tag: String
    var name: String
    var focus: String
    var panelColorHex: String
    var accentColorHex: String
    var ledColorHex: String
    var sortOrder: Int

    @Relationship(deleteRule: .cascade, inverse: \Objective.module)
    var objectives: [Objective] = []

    @Relationship(deleteRule: .cascade, inverse: \TeacherExchange.module)
    var exchanges: [TeacherExchange] = []

    init(
        id: String,
        device: String,
        tag: String,
        name: String,
        focus: String,
        panelColorHex: String,
        accentColorHex: String,
        ledColorHex: String,
        sortOrder: Int
    ) {
        self.id = id
        self.device = device
        self.tag = tag
        self.name = name
        self.focus = focus
        self.panelColorHex = panelColorHex
        self.accentColorHex = accentColorHex
        self.ledColorHex = ledColorHex
        self.sortOrder = sortOrder
    }

    var completionFraction: Double {
        guard !objectives.isEmpty else { return 0 }
        let done = objectives.filter(\.isComplete).count
        return Double(done) / Double(objectives.count)
    }

    var isFullyComplete: Bool {
        !objectives.isEmpty && objectives.allSatisfy(\.isComplete)
    }

    /// Unlock state is derived, not stored: the first module is always
    /// unlocked, and each following one unlocks once the previous is fully
    /// complete. Computing it live (rather than caching it on a stored
    /// property) means it can never go stale after an objective completes
    /// elsewhere in the app; it reads straight off `isFullyComplete`, which
    /// SwiftData's Observation tracks automatically.
    /// `orderedModules` must be sorted by `sortOrder`.
    static func isUnlocked(_ module: Module, orderedModules: [Module]) -> Bool {
        guard let index = orderedModules.firstIndex(where: { $0.id == module.id }) else { return false }
        return index == 0 || orderedModules[index - 1].isFullyComplete
    }
}
