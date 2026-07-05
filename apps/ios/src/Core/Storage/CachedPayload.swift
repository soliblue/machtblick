import Foundation
import SwiftData

@Model
final class CachedPayload {
    @Attribute(.unique) var key: String
    var payload: Data
    var fetchedAt: Date

    init(key: String, payload: Data, fetchedAt: Date) {
        self.key = key
        self.payload = payload
        self.fetchedAt = fetchedAt
    }
}
