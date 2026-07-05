import Foundation
import SwiftData

final class ApiCache {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func cached<T: Decodable>(_ path: String) -> T? {
        entry(path).flatMap { try? JSONDecoder().decode(T.self, from: $0.payload) }
    }

    func fetch<T: Decodable>(_ path: String) async -> T? {
        if let data = await HTTPClient.get(path),
            let decoded = try? JSONDecoder().decode(T.self, from: data)
        {
            store(path, data: data)
            return decoded
        }
        return nil
    }

    func fetchedAt(_ path: String) -> Date? {
        entry(path)?.fetchedAt
    }

    func isStale(_ path: String, maxAge: TimeInterval) -> Bool {
        entry(path).map { Date().timeIntervalSince($0.fetchedAt) > maxAge } ?? true
    }

    func clear() {
        try? context.delete(model: CachedPayload.self)
        try? context.save()
    }

    private func entry(_ path: String) -> CachedPayload? {
        var descriptor = FetchDescriptor<CachedPayload>(predicate: #Predicate { $0.key == path })
        descriptor.fetchLimit = 1
        return (try? context.fetch(descriptor))?.first
    }

    private func store(_ path: String, data: Data) {
        if let existing = entry(path) {
            existing.payload = data
            existing.fetchedAt = Date()
        } else {
            context.insert(CachedPayload(key: path, payload: data, fetchedAt: Date()))
        }
        try? context.save()
    }
}
