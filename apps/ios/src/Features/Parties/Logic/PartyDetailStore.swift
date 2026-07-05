import Foundation
import Observation

@Observable
final class PartyDetailStore {
    private(set) var detail: PartyDetailPayload?
    private(set) var lean: PartyListItem?

    func load(slug: String, cache: ApiCache) async {
        let path = "/parties/\(slug).json"
        if let parties: [PartyListItem] = cache.cached("/api/parties.json") {
            lean = parties.first { $0.slug == slug }
        }
        if detail == nil, let cached: PartyDetailPayload = cache.cached(path) {
            detail = cached
        }
        if detail == nil || cache.isStale(path, maxAge: 86400) {
            if let fresh: PartyDetailPayload = await cache.fetch(path) {
                detail = fresh
            }
        }
    }
}
