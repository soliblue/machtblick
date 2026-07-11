import Foundation

actor SpeechBodyService {
    static let shared = SpeechBodyService()

    private var shards: [String: [String: String]] = [:]

    func text(ids: [String], locale: AppLocale = .current) async -> String {
        var parts: [String] = []
        for id in ids {
            if let body = await body(id: id, locale: locale) { parts.append(body) }
        }
        return parts.joined(separator: "\n\n")
    }

    private func body(id: String, locale: AppLocale) async -> String? {
        let path = shardPath(id: id, locale: locale)
        if shards[path] == nil, let map = await fetch(path) { shards[path] = map }
        return shards[path]?[id]
    }

    private func shardPath(id: String, locale: AppLocale) -> String {
        let shard = SpeechShard.of(id)
        return locale.dataPath("/speeches-search-\(shard).json")
    }

    private func fetch(_ path: String) async -> [String: String]? {
        if let data = await HTTPClient.get(path) {
            return try? JSONDecoder().decode([String: String].self, from: data)
        }
        return nil
    }
}
