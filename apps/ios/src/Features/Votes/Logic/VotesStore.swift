import Foundation
import Observation

@Observable
final class VotesStore {
    private(set) var votes: [VoteListItem] = []
    private(set) var loaded = false
    private(set) var loadFailed = false

    var proposerFilter: String?
    var resultFilter: VoteResult?
    var topicFilter: String?
    var voteTypeFilter: String?
    var flagFilter: VoteFlagFilter = .all

    private var path: String { AppLocale.current.dataPath("/api/votes.json") }

    func load(cache: ApiCache) async {
        if votes.isEmpty, let cached: [VoteListItem] = cache.cached(path) {
            votes = cached
        }
        if votes.isEmpty || cache.isStale(path, maxAge: 3600) {
            await fetchLatest(cache: cache)
        }
        loaded = true
    }

    func refresh(cache: ApiCache) async {
        await fetchLatest(cache: cache)
    }

    private func fetchLatest(cache: ApiCache) async {
        if let fresh: [VoteListItem] = await cache.fetch(path) {
            votes = fresh
            loadFailed = false
        } else if votes.isEmpty {
            loadFailed = true
        }
    }

    var hasVoteType: Bool {
        votes.contains { $0.voteType != nil }
    }

    var hasTopic: Bool {
        votes.contains { $0.topic != nil }
    }

    var availableProposers: [String] {
        Array(Set(votes.compactMap(\.initiator))).sorted {
            $0.compare($1, locale: AppLocale.current.locale) == .orderedAscending
        }
    }

    var availableTopics: [String] {
        var counts: [String: Int] = [:]
        for vote in votes {
            if let topic = vote.topic { counts[topic, default: 0] += 1 }
        }
        return counts.sorted {
            $0.value > $1.value
                || ($0.value == $1.value
                    && $0.key.compare($1.key, locale: AppLocale.current.locale) == .orderedAscending)
        }
            .map(\.key)
    }

    var activeFilterCount: Int {
        var count = [proposerFilter, topicFilter, voteTypeFilter].filter { $0 != nil }.count
        if resultFilter != nil { count += 1 }
        if flagFilter != .all { count += 1 }
        return count
    }

    var filtered: [VoteListItem] {
        votes.filter { vote in
            (proposerFilter == nil || vote.initiator == proposerFilter)
                && (resultFilter == nil || vote.result == resultFilter)
                && (topicFilter == nil || vote.topic == topicFilter)
                && (voteTypeFilter == nil || vote.voteType == voteTypeFilter)
        }
    }
}
