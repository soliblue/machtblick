import Foundation
import Observation

@Observable
final class VotesStore {
    private(set) var votes: [VoteListItem] = []
    private(set) var loaded = false

    func load(cache: ApiCache) async {
        if votes.isEmpty, let cached: [VoteListItem] = cache.cached("/api/votes.json") {
            votes = cached
        }
        if votes.isEmpty || cache.isStale("/api/votes.json", maxAge: 3600) {
            if let fresh: [VoteListItem] = await cache.fetch("/api/votes.json") {
                votes = fresh
            }
        }
        loaded = true
    }
}
