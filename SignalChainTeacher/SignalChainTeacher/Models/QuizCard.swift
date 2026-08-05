import Foundation
import SwiftData

@Model
final class QuizCard {
    @Attribute(.unique) var id: String
    var filmMoment: String
    var moduleName: String
    var technique: String
    var isLearned: Bool
    var sortOrder: Int

    init(
        id: String,
        filmMoment: String,
        moduleName: String,
        technique: String,
        sortOrder: Int,
        isLearned: Bool = false
    ) {
        self.id = id
        self.filmMoment = filmMoment
        self.moduleName = moduleName
        self.technique = technique
        self.sortOrder = sortOrder
        self.isLearned = isLearned
    }
}
