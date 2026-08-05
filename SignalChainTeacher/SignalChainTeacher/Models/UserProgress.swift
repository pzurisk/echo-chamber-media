import Foundation
import SwiftData

/// Singleton row. There is always exactly one; SeedContent creates it once
/// on first launch and everything else updates it in place.
@Model
final class UserProgress {
    var totalXP: Int
    var currentLevel: String
    var lastOpenedModuleID: String?

    init(totalXP: Int = 0, currentLevel: String, lastOpenedModuleID: String? = nil) {
        self.totalXP = totalXP
        self.currentLevel = currentLevel
        self.lastOpenedModuleID = lastOpenedModuleID
    }
}
