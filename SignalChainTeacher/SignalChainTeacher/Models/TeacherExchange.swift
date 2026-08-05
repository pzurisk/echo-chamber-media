import Foundation
import SwiftData

/// One "Ask the teacher" round trip, logged against a module so the teacher
/// has context on what Billy already tried when he comes back to it later.
@Model
final class TeacherExchange {
    @Attribute(.unique) var id: UUID
    var objectiveID: String?
    var userInput: String
    var teacherResponse: String
    var timestamp: Date
    var markedObjectiveComplete: Bool
    var module: Module?

    init(
        objectiveID: String?,
        userInput: String,
        teacherResponse: String,
        markedObjectiveComplete: Bool,
        timestamp: Date
    ) {
        self.id = UUID()
        self.objectiveID = objectiveID
        self.userInput = userInput
        self.teacherResponse = teacherResponse
        self.markedObjectiveComplete = markedObjectiveComplete
        self.timestamp = timestamp
    }
}
