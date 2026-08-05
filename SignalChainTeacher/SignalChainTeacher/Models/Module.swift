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
    var isUnlocked: Bool

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
        sortOrder: Int,
        isUnlocked: Bool = false
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
        self.isUnlocked = isUnlocked
    }

    var completionFraction: Double {
        guard !objectives.isEmpty else { return 0 }
        let done = objectives.filter(\.isComplete).count
        return Double(done) / Double(objectives.count)
    }

    var isFullyComplete: Bool {
        !objectives.isEmpty && objectives.allSatisfy(\.isComplete)
    }
}
