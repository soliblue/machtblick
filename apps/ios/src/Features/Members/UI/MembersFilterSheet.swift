import SwiftUI

struct MembersFilterSheet: View {
    @Bindable var store: MembersStore

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker(selection: $store.party) {
                        Text(Copy.filterAll).tag(String?.none)
                        ForEach(store.parties, id: \.self) { party in
                            Text(PartyStyle.label(party)).tag(String?(party))
                        }
                    } label: {
                        Label(Copy.filterFaction, systemImage: "building.columns")
                    }
                }
                Section {
                    Picker(selection: $store.state) {
                        Text(Copy.filterAll).tag(String?.none)
                        ForEach(store.states, id: \.self) { state in
                            Text(state).tag(String?(state))
                        }
                    } label: {
                        Label(Copy.filterState, systemImage: "map")
                    }
                }
                Section {
                    Picker(selection: $store.sex) {
                        Text(Copy.filterAll).tag(String?.none)
                        ForEach(store.sexes, id: \.self) { key in
                            Text(MemberLabels.sex(key)).tag(String?(key))
                        }
                    } label: {
                        Label(Copy.filterSex, systemImage: "person.2")
                    }
                }
                Section {
                    Picker(selection: $store.ageBucket) {
                        Text(Copy.filterAll).tag(AgeBucket?.none)
                        ForEach(store.ageBuckets, id: \.self) { bucket in
                            Text(bucket.label).tag(AgeBucket?(bucket))
                        }
                    } label: {
                        Label(Copy.filterAge, systemImage: "calendar")
                    }
                }
                Section {
                    Picker(selection: $store.mandate) {
                        Text(Copy.filterAll).tag(String?.none)
                        ForEach(store.mandates, id: \.self) { key in
                            Text(MemberLabels.mandate(key)).tag(String?(key))
                        }
                    } label: {
                        Label(Copy.filterMandate, systemImage: "signature")
                    }
                }
                Section {
                    Picker(selection: $store.sort) {
                        ForEach(MemberSort.allCases, id: \.self) { key in
                            Text(key.label).tag(key)
                        }
                    } label: {
                        Label(Copy.sortLabel, systemImage: "arrow.up.arrow.down")
                    }
                    Picker(Copy.sortLabel, selection: $store.sortDescending) {
                        Text(store.sort == .name ? "A-Z" : Copy.ascending).tag(false)
                        Text(store.sort == .name ? "Z-A" : Copy.descending).tag(true)
                    }
                    .pickerStyle(.segmented)
                }
            }
            .navigationTitle(Copy.filterLabel)
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: store.sort) { store.sortDescending = store.sort.defaultsDescending }
            .sensoryFeedback(.selection, trigger: store.activeFilterCount)
            .sensoryFeedback(.selection, trigger: store.sort)
            .sensoryFeedback(.selection, trigger: store.sortDescending)
        }
    }
}
