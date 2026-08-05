import Foundation
import SwiftData

enum CompletionSource: String, Codable {
    case manual
    case teacher
}

@Model
final class Objective {
    @Attribute(.unique) var id: String
    var text: String
    var xpValue: Int
    var isComplete: Bool
    var completedVia: CompletionSource?
    var sortOrder: Int
    var module: Module?

    init(
        id: String,
        text: String,
        xpValue: Int,
        sortOrder: Int,
        isComplete: Bool = false,
        completedVia: CompletionSource? = nil
    ) {
        self.id = id
        self.text = text
        self.xpValue = xpValue
        self.sortOrder = sortOrder
        self.isComplete = isComplete
        self.completedVia = completedVia
    }
}
