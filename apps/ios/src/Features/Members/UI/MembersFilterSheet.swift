import SwiftUI

struct MembersFilterSheet: View {
    @Bindable var store: MembersStore

    var body: some View {
        NavigationStack {
            Form {
                Section(Copy.filterFaction) {
                    Picker(Copy.filterFaction, selection: $store.party) {
                        Text(Copy.filterAll).tag(String?.none)
                        ForEach(store.parties, id: \.self) { party in
                            Text(PartyStyle.label(party)).tag(String?(party))
                        }
                    }
                }
                Section(Copy.filterState) {
                    Picker(Copy.filterState, selection: $store.state) {
                        Text(Copy.filterAll).tag(String?.none)
                        ForEach(store.states, id: \.self) { state in
                            Text(state).tag(String?(state))
                        }
                    }
                }
                Section(Copy.filterSex) {
                    Picker(Copy.filterSex, selection: $store.sex) {
                        Text(Copy.filterAll).tag(String?.none)
                        ForEach(store.sexes, id: \.self) { key in
                            Text(MemberLabels.sex(key)).tag(String?(key))
                        }
                    }
                }
                Section(Copy.filterAge) {
                    Picker(Copy.filterAge, selection: $store.ageBucket) {
                        Text(Copy.filterAll).tag(AgeBucket?.none)
                        ForEach(store.ageBuckets, id: \.self) { bucket in
                            Text(bucket.label).tag(AgeBucket?(bucket))
                        }
                    }
                }
                Section(Copy.filterMandate) {
                    Picker(Copy.filterMandate, selection: $store.mandate) {
                        Text(Copy.filterAll).tag(String?.none)
                        ForEach(store.mandates, id: \.self) { key in
                            Text(MemberLabels.mandate(key)).tag(String?(key))
                        }
                    }
                }
                Section(Copy.sortLabel) {
                    Picker(Copy.sortName, selection: $store.sortDescending) {
                        Text("A-Z").tag(false)
                        Text("Z-A").tag(true)
                    }
                    .pickerStyle(.segmented)
                }
            }
            .navigationTitle(Copy.filterLabel)
            .navigationBarTitleDisplayMode(.inline)
            .sensoryFeedback(.selection, trigger: store.activeFilterCount)
            .sensoryFeedback(.selection, trigger: store.sortDescending)
        }
    }
}
