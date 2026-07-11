import Foundation
import Observation

@Observable
final class PartyDetailStore {
    private(set) var detail: PartyDetailPayload?
    private(set) var lean: PartyListItem?
    private(set) var members: [MemberListItem] = []
    private(set) var loadFailed = false

    func load(slug: String, cache: ApiCache) async {
        loadFailed = false
        let path = AppLocale.current.dataPath("/parties/\(slug).json")
        let membersPath = AppLocale.current.dataPath("/api/members.json")
        if let parties: [PartyListItem] = cache.cached(AppLocale.current.dataPath("/api/parties.json")) {
            lean = parties.first { $0.slug == slug }
        }
        if members.isEmpty, let cached: [MemberListItem] = cache.cached(membersPath) {
            members = cached
        }
        if detail == nil, let cached: PartyDetailPayload = cache.cached(path) {
            detail = cached
        }
        if detail == nil || cache.isStale(path, maxAge: 86400) {
            if let fresh: PartyDetailPayload = await cache.fetch(path) {
                detail = fresh
            } else if detail == nil {
                loadFailed = true
            }
        }
        if members.isEmpty, let fresh: [MemberListItem] = await cache.fetch(membersPath) {
            members = fresh
        }
    }
}
