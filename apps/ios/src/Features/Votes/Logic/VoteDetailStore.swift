import Foundation
import Observation

@Observable
final class VoteDetailStore {
    private(set) var detail: VoteDetailPayload?
    private(set) var signatories: [MotionDetailPayload.Signatory] = []
    private(set) var loadFailed = false

    func load(id: String, cache: ApiCache) async {
        loadFailed = false
        let path = AppLocale.current.dataPath(Endpoints.vote(id))
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
        await loadSignatories(cache: cache)
    }

    private func loadSignatories(cache: ApiCache) async {
        if let antragId = detail?.antraege?.first?.antragId {
            let path = AppLocale.current.dataPath(Endpoints.motion(antragId))
            if let cached: MotionDetailPayload = cache.cached(path) {
                signatories = cached.signatories
            }
            if let fresh: MotionDetailPayload = await cache.fetch(path) {
                signatories = fresh.signatories
            }
        }
    }
}
