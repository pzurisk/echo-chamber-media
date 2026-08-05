import Foundation
import SwiftData

/// Singleton row, created once on first launch. XP and level are not
/// stored here: they are computed live from objectives and quiz cards
/// (see XPCalculator) so they can never drift out of sync with the data
/// that actually determines them. This model only holds state that has no
/// other source of truth.
@Model
final class UserProgress {
    var lastOpenedModuleID: String?

    init(lastOpenedModuleID: String? = nil) {
        self.lastOpenedModuleID = lastOpenedModuleID
    }
}
