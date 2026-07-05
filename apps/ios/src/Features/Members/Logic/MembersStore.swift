import Foundation
import Observation

@Observable
final class MembersStore {
    private(set) var members: [MemberListItem] = []
    var search = ""
    var party: String?
    var state: String?

    var filtered: [MemberListItem] {
        members.filter { member in
            (party == nil || member.party == party)
                && (state == nil || member.state == state)
                && (search.isEmpty || member.name.localizedStandardContains(search))
        }
    }

    var parties: [String] {
        PartyStyle.order.filter { name in members.contains { $0.party == name } }
    }

    var states: [String] {
        Array(Set(members.map(\.state))).filter { !$0.isEmpty }.sorted()
    }

    func load(cache: ApiCache) async {
        if members.isEmpty, let cached: [MemberListItem] = cache.cached("/api/members.json") {
            members = cached
        }
        if members.isEmpty || cache.isStale("/api/members.json", maxAge: 3600) {
            if let fresh: [MemberListItem] = await cache.fetch("/api/members.json") {
                members = fresh
            }
        }
    }
}
