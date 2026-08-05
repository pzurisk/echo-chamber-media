import Foundation
import SwiftData

/// A freeform "describe a film moment" round trip from the Cue Vocabulary
/// screen. Separate from TeacherExchange since it is not tied to a module
/// objective, just a standing suggestion log.
@Model
final class QuizExchange {
    @Attribute(.unique) var id: UUID
    var userDescription: String
    var teacherSuggestion: String
    var timestamp: Date

    init(userDescription: String, teacherSuggestion: String, timestamp: Date) {
        self.id = UUID()
        self.userDescription = userDescription
        self.teacherSuggestion = teacherSuggestion
        self.timestamp = timestamp
    }
}
