import Foundation
import Observation

@Observable
final class VotesStore {
    private(set) var votes: [VoteListItem] = []
    private(set) var loaded = false

    var proposerFilter: String?
    var resultFilter: VoteResult?
    var topicFilter: String?
    var voteTypeFilter: String? = "namentlich"

    func load(cache: ApiCache) async {
        if votes.isEmpty, let cached: [VoteListItem] = cache.cached("/api/votes.json") {
            votes = cached
        }
        if votes.isEmpty || cache.isStale("/api/votes.json", maxAge: 3600) {
            if let fresh: [VoteListItem] = await cache.fetch("/api/votes.json") {
                votes = fresh
            }
        }
        loaded = true
    }

    var hasVoteType: Bool {
        votes.contains { $0.voteType != nil }
    }

    var hasTopic: Bool {
        votes.contains { $0.topic != nil }
    }

    var availableProposers: [String] {
        Array(Set(votes.compactMap(\.initiator))).sorted()
    }

    var availableTopics: [String] {
        var counts: [String: Int] = [:]
        for vote in votes {
            if let topic = vote.topic { counts[topic, default: 0] += 1 }
        }
        return counts.sorted { $0.value > $1.value || ($0.value == $1.value && $0.key < $1.key) }
            .map(\.key)
    }

    var activeFilterCount: Int {
        var count = [proposerFilter, topicFilter].filter { $0 != nil }.count
        if resultFilter != nil { count += 1 }
        if hasVoteType && voteTypeFilter != nil { count += 1 }
        return count
    }

    var filtered: [VoteListItem] {
        votes.filter { vote in
            (proposerFilter == nil || vote.initiator == proposerFilter)
                && (resultFilter == nil || vote.result == resultFilter)
                && (topicFilter == nil || vote.topic == topicFilter)
                && (voteTypeFilter == nil || vote.voteType == nil || vote.voteType == voteTypeFilter)
        }
    }
}
