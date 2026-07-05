import Foundation
import Observation

@Observable
final class PartiesStore {
    private(set) var parties: [PartyListItem] = []
    private(set) var loadFailed = false

    func load(cache: ApiCache) async {
        if parties.isEmpty, let cached: [PartyListItem] = cache.cached("/api/parties.json") {
            parties = cached
        }
        if parties.isEmpty || cache.isStale("/api/parties.json", maxAge: 3600) {
            await fetchLatest(cache: cache)
        }
    }

    func refresh(cache: ApiCache) async {
        await fetchLatest(cache: cache)
    }

    private func fetchLatest(cache: ApiCache) async {
        if let fresh: [PartyListItem] = await cache.fetch("/api/parties.json") {
            parties = fresh
            loadFailed = false
        } else if parties.isEmpty {
            loadFailed = true
        }
    }
}
