import SwiftUI

struct MemberVoteRelation: View {
    let entry: MemberDetailPayload.HistoryEntry

    private var partyMajority: BallotChoice? {
        entry.partyMajority.flatMap(BallotChoice.init)
    }

    private var summaries: [PartyVoteSummary] {
        entry.partySummaries ?? []
    }

    private var highlight: PartyDonutHighlight? {
        partyMajority.map {
            PartyDonutHighlight(party: entry.party, color: $0.color)
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            MemberVoteStatus(entry: entry)
            if !summaries.isEmpty {
                PartyDonutRow(summaries: summaries, highlight: highlight)
                    .padding(.top, partyMajority == nil ? ThemeTokens.Spacing.l : 0)
            }
        }
        .overlayPreferenceValue(PartyDonutConnectorPreferenceKey.self) { anchors in
            GeometryReader { proxy in
                MemberVoteConnector(
                    anchors: anchors,
                    proxy: proxy,
                    memberChoice: entry.choice,
                    partyMajority: partyMajority,
                    deviation: entry.choice != .nichtAbgegeben && entry.defected == true
                )
            }
        }
    }
}
