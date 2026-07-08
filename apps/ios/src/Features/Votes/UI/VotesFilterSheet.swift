import SwiftUI

struct VotesFilterSheet: View {
    @Bindable var store: VotesStore

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker(selection: $store.flagFilter) {
                        ForEach(VoteFlagFilter.allCases, id: \.self) { filter in
                            Text(filter.label).tag(filter)
                        }
                    } label: {
                        Label(Copy.flagFilter, systemImage: "bookmark")
                    }
                }
                if store.hasVoteType {
                    Section {
                        Picker(selection: $store.voteTypeFilter) {
                            Text(Copy.filterAll).tag(String?.none)
                            Text(Copy.namedVote).tag(String?("namentlich"))
                            Text(Copy.showOfHands).tag(String?("handzeichen"))
                        } label: {
                            Label(Copy.filterType, systemImage: "doc.text")
                        }
                    }
                }
                Section {
                    Picker(selection: $store.proposerFilter) {
                        Text(Copy.filterAll).tag(String?.none)
                        ForEach(store.availableProposers, id: \.self) { proposer in
                            Text(PartyStyle.label(proposer)).tag(String?(proposer))
                        }
                    } label: {
                        Label(Copy.filterProposer, systemImage: "building.columns")
                    }
                }
                Section {
                    Picker(selection: $store.resultFilter) {
                        Text(Copy.filterAll).tag(VoteResult?.none)
                        Text(Copy.accepted).tag(VoteResult?(.angenommen))
                        Text(Copy.rejected).tag(VoteResult?(.abgelehnt))
                    } label: {
                        Label(Copy.resultSection, systemImage: "checkmark.seal")
                    }
                }
                if store.hasTopic {
                    Section {
                        Picker(selection: $store.topicFilter) {
                            Text(Copy.filterAll).tag(String?.none)
                            ForEach(store.availableTopics, id: \.self) { topic in
                                Text(topic).tag(String?(topic))
                            }
                        } label: {
                            Label(Copy.filterCategory, systemImage: "tag")
                        }
                    }
                }
            }
            .navigationTitle(Copy.filterLabel)
            .navigationBarTitleDisplayMode(.inline)
            .sensoryFeedback(.selection, trigger: store.activeFilterCount)
        }
    }
}
