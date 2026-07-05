import SwiftUI

struct PartiesView: View {
    let store: PartiesStore
    let cache: ApiCache

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
                PartySeatMapView(parties: store.parties)
                LazyVGrid(
                    columns: Array(
                        repeating: GridItem(.flexible(), spacing: ThemeTokens.Spacing.m), count: 2),
                    spacing: ThemeTokens.Spacing.m
                ) {
                    ForEach(store.parties) { party in
                        NavigationLink(value: AppRoute.party(party.slug)) {
                            PartyCardView(party: party, totalSeats: totalSeats)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(ThemeTokens.Spacing.l)
        }
        .background(ThemeColor.background)
        .navigationTitle(Copy.partiesTab)
        .navigationBarTitleDisplayMode(.inline)
        .appDestinations(cache: cache)
        .task { await store.load(cache: cache) }
    }

    private var totalSeats: Int {
        store.parties.reduce(0) { $0 + $1.seats }
    }
}
