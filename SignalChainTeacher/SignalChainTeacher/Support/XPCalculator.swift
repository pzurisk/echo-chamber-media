import Foundation

/// XP thresholds and scoring, ported as-is from the HTML artifact's
/// xpConfig so levels and totals match the version Billy already knows.
enum XPCalculator {
    static let taskXP = 10
    static let dayBonusXP = 50
    static let quizXP = 5

    /// Ordered lowest to highest. currentLevel is the highest entry whose
    /// minXP is at or below the total.
    static let levels: [(name: String, minXP: Int)] = [
        ("Rookie Patcher", 0),
        ("Signal Wrangler", 90),
        ("Module Tamer", 230),
        ("Cue Composer", 380),
        ("Rack Master", 500)
    ]

    static func levelName(forXP xp: Int) -> String {
        levels.last(where: { xp >= $0.minXP })?.name ?? levels[0].name
    }

    /// Total XP across completed objectives, per-module day bonuses (all
    /// objectives in a module complete), and learned quiz cards.
    static func totalXP(modules: [Module], quizCards: [QuizCard]) -> Int {
        var total = 0
        for module in modules {
            let completedObjectives = module.objectives.filter(\.isComplete).count
            total += completedObjectives * taskXP
            if module.isFullyComplete {
                total += dayBonusXP
            }
        }
        total += quizCards.filter(\.isLearned).count * quizXP
        return total
    }
}
