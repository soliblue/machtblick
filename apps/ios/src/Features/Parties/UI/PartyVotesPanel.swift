import SwiftUI

struct PartyVotesPanel: View {
    let votes: [PartyDetailPayload.VoteEntry]
    @State private var stance: PartyPosition?
    @State private var result: VoteResult?

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
            PartyLineFingerprint(votes: votes, selected: $stance)
            HStack(spacing: ThemeTokens.Spacing.s) {
                Menu {
                    Picker(Copy.partyVotedLabel, selection: $stance) {
                        Text(Copy.filterAll).tag(PartyPosition?.none)
                        Text(Copy.yes).tag(PartyPosition?(.yes))
                        Text(Copy.no).tag(PartyPosition?(.no))
                        Text(Copy.abstain).tag(PartyPosition?(.abstain))
                        Text(Copy.positionMixed).tag(PartyPosition?(.split))
                    }
                } label: {
                    FilterPillLabel(name: Copy.partyVotedLabel, value: stance.map { PartyLineFingerprint.key($0).label })
                }
                Menu {
                    Picker(Copy.resultSection, selection: $result) {
                        Text(Copy.filterAll).tag(VoteResult?.none)
                        Text(Copy.accepted).tag(VoteResult?(.angenommen))
                        Text(Copy.rejected).tag(VoteResult?(.abgelehnt))
                    }
                } label: {
                    FilterPillLabel(name: Copy.resultSection, value: result?.label)
                }
                Spacer(minLength: 0)
            }
            LazyVStack(alignment: .leading, spacing: 0) {
                ForEach(filtered) { vote in
                    PartyVoteRow(vote: vote)
                }
            }
        }
    }

    private var filtered: [PartyDetailPayload.VoteEntry] {
        votes.filter { vote in
            (result == nil || vote.result == result)
                && (stance == nil || PartyLineFingerprint.key(vote.partyVote) == stance)
        }
    }
}
