import Foundation
import Observation

@Observable
final class VoteDetailStore {
    private(set) var detail: VoteDetailPayload?
    private(set) var loadFailed = false

    func load(id: String, cache: ApiCache) async {
        loadFailed = false
        let path = "/votes/\(id).json"
        if detail == nil, let cached: VoteDetailPayload = cache.cached(path) {
            detail = cached
        }
        if detail == nil || cache.isStale(path, maxAge: 86400) {
            if let fresh: VoteDetailPayload = await cache.fetch(path) {
                detail = fresh
            } else if detail == nil {
                loadFailed = true
            }
        }
    }
}
