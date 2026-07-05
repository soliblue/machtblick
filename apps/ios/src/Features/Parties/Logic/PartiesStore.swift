import Foundation
import Observation

@Observable
final class PartiesStore {
    private(set) var parties: [PartyListItem] = []

    func load(cache: ApiCache) async {
        if parties.isEmpty, let cached: [PartyListItem] = cache.cached("/api/parties.json") {
            parties = cached
        }
        if parties.isEmpty || cache.isStale("/api/parties.json", maxAge: 3600) {
            if let fresh: [PartyListItem] = await cache.fetch("/api/parties.json") {
                parties = fresh
            }
        }
    }
}
