import Foundation
import Observation

@Observable
final class PartiesStore {
    private(set) var parties: [PartyListItem] = []
    private(set) var loadFailed = false

    private var path: String { AppLocale.current.dataPath(Endpoints.parties) }

    func load(cache: ApiCache) async {
        if parties.isEmpty, let cached: [PartyListItem] = cache.cached(path) {
            parties = cached
        }
        if parties.isEmpty || cache.isStale(path, maxAge: 3600) {
            await fetchLatest(cache: cache)
        }
    }

    func refresh(cache: ApiCache) async {
        await fetchLatest(cache: cache)
    }

    private func fetchLatest(cache: ApiCache) async {
        if let fresh: [PartyListItem] = await cache.fetch(path) {
            parties = fresh
            loadFailed = false
        } else if parties.isEmpty {
            loadFailed = true
        }
    }
}
