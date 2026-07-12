import Foundation
import Observation

@Observable
final class MemberDetailStore {
    private(set) var detail: MemberDetailPayload?
    private(set) var loadFailed = false

    func load(id: String, cache: ApiCache) async {
        loadFailed = false
        let path = AppLocale.current.dataPath("/members/\(id).json")
        if detail == nil, let cached: MemberDetailPayload = cache.cached(path) {
            detail = cached
        }
        if detail == nil || detail?.needsEnrichmentRefresh == true
            || cache.isStale(path, maxAge: 86400)
        {
            if let fresh: MemberDetailPayload = await cache.fetch(path) {
                detail = fresh
            } else if detail == nil {
                loadFailed = true
            }
        }
    }
}
