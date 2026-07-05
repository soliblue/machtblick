import SwiftUI

struct VotesFilterSheet: View {
    @Bindable var store: VotesStore

    var body: some View {
        NavigationStack {
            Form {
                if store.hasVoteType {
                    Section(Copy.filterType) {
                        Picker(Copy.filterType, selection: $store.voteTypeFilter) {
                            Text(Copy.filterAll).tag(String?.none)
                            Text(Copy.namedVote).tag(String?("namentlich"))
                            Text(Copy.showOfHands).tag(String?("handzeichen"))
                        }
                    }
                }
                Section(Copy.filterProposer) {
                    Picker(Copy.filterProposer, selection: $store.proposerFilter) {
                        Text(Copy.filterAll).tag(String?.none)
                        ForEach(store.availableProposers, id: \.self) { proposer in
                            Text(PartyStyle.label(proposer)).tag(String?(proposer))
                        }
                    }
                }
                Section(Copy.resultSection) {
                    Picker(Copy.resultSection, selection: $store.resultFilter) {
                        Text(Copy.filterAll).tag(VoteResult?.none)
                        Text(Copy.accepted).tag(VoteResult?(.angenommen))
                        Text(Copy.rejected).tag(VoteResult?(.abgelehnt))
                    }
                }
                if store.hasTopic {
                    Section(Copy.filterCategory) {
                        Picker(Copy.filterCategory, selection: $store.topicFilter) {
                            Text(Copy.filterAll).tag(String?.none)
                            ForEach(store.availableTopics, id: \.self) { topic in
                                Text(topic).tag(String?(topic))
                            }
                        }
                    }
                }
            }
            .navigationTitle(Copy.filterLabel)
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
