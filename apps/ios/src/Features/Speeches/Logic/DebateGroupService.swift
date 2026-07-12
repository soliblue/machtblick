import Foundation

enum DebateGroupService {
    static func speeches(debateGroupId: String, cache: ApiCache) async -> [SpeechSummary] {
        let path = AppLocale.current.dataPath(Endpoints.speechesMeta)
        var meta: [SpeechMetaEntry]? = cache.cached(path)
        if meta == nil || cache.isStale(path, maxAge: 86400) {
            if let fresh: [SpeechMetaEntry] = await cache.fetch(path) { meta = fresh }
        }
        return (meta ?? [])
            .filter { $0.debateGroupId == debateGroupId }
            .sorted { $0.position < $1.position }
            .map(\.summary)
    }
}
