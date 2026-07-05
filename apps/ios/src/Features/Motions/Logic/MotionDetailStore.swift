import Foundation
import Observation

@Observable
final class MotionDetailStore {
    private(set) var detail: MotionDetailPayload?

    func load(id: Int, cache: ApiCache) async {
        let path = "/motions/\(id).json"
        if detail == nil, let cached: MotionDetailPayload = cache.cached(path) {
            detail = cached
        }
        if detail == nil || cache.isStale(path, maxAge: 86400) {
            if let fresh: MotionDetailPayload = await cache.fetch(path) {
                detail = fresh
            }
        }
    }
}
