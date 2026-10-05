import Foundation
import Observation

@Observable
final class MotionDetailStore {
    private(set) var detail: MotionDetailPayload?
    private(set) var linkedVoteDetails: [String: VoteDetailPayload] = [:]
    private(set) var linkedVotesLoaded = false
    private(set) var loadFailed = false
    var selectedTab: MotionDetailTab = .result

    var availableTabs: [MotionDetailTab] {
        (detail?.linkedVotes.isEmpty == false ? [.result] : [])
            + [.details] + (speeches.isEmpty ? [] : [.speeches])
    }

    var speeches: [SpeechSummary] {
        detail.map { MotionDebateAdapter.speeches($0, linkedVoteDetails: linkedVoteDetails) } ?? []
    }

    var partySummaries: [PartySummaryReader] {
        detail.map { MotionDebateAdapter.partySummaries($0, linkedVoteDetails: linkedVoteDetails) } ?? []
    }

    var proposers: [String] {
        detail?.antrag.initiativeFraktion?.split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) } ?? []
    }

    var isLaenderInitiative: Bool {
        Bundeslaender.isLaenderInitiative(detail?.antrag.initiativeFraktion)
    }

    var status: MotionStatusBucket {
        MotionStatusBucket.of(detail?.antrag.beratungsstand)
    }

    var statusLabel: String {
        MotionTimeline.statusStamp(detail?.antrag.beratungsstand, hasVote: false)
            ?? (status == .angenommen ? Copy.accepted
                : status == .abgelehnt ? Copy.rejected
                : status == .nichtBeraten ? Copy.stampNichtBeraten : Copy.stampImVerfahren)
    }

    var stages: [MotionStage] {
        detail.map {
            MotionTimeline.stages(
                type: $0.antrag.type, beratungsstand: $0.antrag.beratungsstand,
                introducedDate: $0.antrag.introducedDate, firstVote: $0.linkedVotes.first)
        } ?? []
    }

    func load(id: Int, cache: ApiCache) async {
        loadFailed = false
        linkedVotesLoaded = false
        let path = AppLocale.current.dataPath(Endpoints.motion(id))
        if detail == nil, let cached: MotionDetailPayload = cache.cached(path) {
            detail = cached
            selectedTab = availableTabs.contains(selectedTab) ? selectedTab : availableTabs[0]
        }
        if detail == nil || cache.isStale(path, maxAge: 86400) {
            if let fresh: MotionDetailPayload = await cache.fetch(path) {
                detail = fresh
                selectedTab = availableTabs.contains(selectedTab) ? selectedTab : availableTabs[0]
            } else if detail == nil {
                loadFailed = true
            }
        }
        if let detail {
            for vote in detail.linkedVotes {
                if let cached: VoteDetailPayload = cache.cached(AppLocale.current.dataPath(Endpoints.vote(vote.id))) {
                    linkedVoteDetails[vote.id] = cached
                }
            }
            selectedTab = availableTabs.contains(selectedTab) ? selectedTab : availableTabs[0]
            for vote in detail.linkedVotes {
                let path = AppLocale.current.dataPath(Endpoints.vote(vote.id))
                if linkedVoteDetails[vote.id] == nil || cache.isStale(path, maxAge: 86400) {
                    if let fresh: VoteDetailPayload = await cache.fetch(path) {
                        linkedVoteDetails[vote.id] = fresh
                    }
                }
            }
            selectedTab = availableTabs.contains(selectedTab) ? selectedTab : availableTabs[0]
            linkedVotesLoaded = detail.linkedVotes.allSatisfy { linkedVoteDetails[$0.id] != nil }
        }
    }
}
