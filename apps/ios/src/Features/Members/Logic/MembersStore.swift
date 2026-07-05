import Foundation
import Observation

@Observable
final class MembersStore {
    private(set) var members: [MemberListItem] = []
    private(set) var loadFailed = false
    var search = ""
    var party: String?
    var state: String?
    var sex: String?
    var ageBucket: AgeBucket?
    var mandate: String?
    var sortDescending = false

    var filtered: [MemberListItem] {
        members
            .filter { member in
                (party == nil || member.party == party)
                    && (state == nil || member.state == state)
                    && (sex == nil || member.sex == sex)
                    && (ageBucket == nil || AgeBucket.of(member.yearOfBirth) == ageBucket)
                    && (mandate == nil || member.mandateType == mandate)
                    && (search.isEmpty || member.name.localizedStandardContains(search))
            }
            .sorted {
                let order = $0.lastName.localizedCompare($1.lastName)
                return sortDescending ? order == .orderedDescending : order == .orderedAscending
            }
    }

    var activeFilterCount: Int {
        [party != nil, state != nil, sex != nil, ageBucket != nil, mandate != nil].filter { $0 }.count
    }

    var parties: [String] {
        PartyStyle.order.filter { name in members.contains { $0.party == name } }
    }

    var states: [String] {
        Array(Set(members.map(\.state))).filter { !$0.isEmpty }.sorted()
    }

    var sexes: [String] {
        ["m", "f", "d"].filter { key in members.contains { $0.sex == key } }
    }

    var ageBuckets: [AgeBucket] {
        AgeBucket.allCases.filter { bucket in members.contains { AgeBucket.of($0.yearOfBirth) == bucket } }
    }

    var mandates: [String] {
        ["direkt", "liste"].filter { key in members.contains { $0.mandateType == key } }
    }

    func load(cache: ApiCache) async {
        if members.isEmpty, let cached: [MemberListItem] = cache.cached("/api/members.json") {
            members = cached
        }
        if members.isEmpty || cache.isStale("/api/members.json", maxAge: 3600) {
            await fetchLatest(cache: cache)
        }
    }

    func refresh(cache: ApiCache) async {
        await fetchLatest(cache: cache)
    }

    private func fetchLatest(cache: ApiCache) async {
        if let fresh: [MemberListItem] = await cache.fetch("/api/members.json") {
            members = fresh
            loadFailed = false
        } else if members.isEmpty {
            loadFailed = true
        }
    }
}
