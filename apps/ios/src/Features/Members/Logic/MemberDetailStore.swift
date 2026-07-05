import Foundation
import Observation

@Observable
final class MemberDetailStore {
    private(set) var detail: MemberDetailPayload?

    func load(id: String, cache: ApiCache) async {
        let path = "/members/\(id).json"
        if detail == nil, let cached: MemberDetailPayload = cache.cached(path) {
            detail = cached
        }
        if detail == nil || cache.isStale(path, maxAge: 86400) {
            if let fresh: MemberDetailPayload = await cache.fetch(path) {
                detail = fresh
            }
        }
    }
}
