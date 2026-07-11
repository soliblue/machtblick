import SwiftUI

struct PartiesView: View {
    let store: PartiesStore
    let cache: ApiCache
    @State private var refreshTick = 0
    @State private var scroll = ScrollPositionModel()

    var body: some View {
        Group {
            if store.parties.isEmpty && store.loadFailed {
                ErrorStateView(message: Copy.loadError) { Task { await store.load(cache: cache) } }
            } else if store.parties.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                list
            }
        }
        .background(ThemeColor.background)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                BrandWordmark(scroll: scroll)
            }
            .sharedBackgroundVisibility(.hidden)
        }
        .sensoryFeedback(.success, trigger: refreshTick)
        .appDestinations(cache: cache)
        .task { await store.load(cache: cache) }
    }

    private var list: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
                PartySeatMapView(parties: store.parties)
                section(
                    caption: "\(Copy.govLabel) · \(governingSeats) \(Copy.vonWord) \(totalSeats) \(Copy.seatsGenitive)",
                    parties: governing)
                section(caption: "\(Copy.oppositionLabel) · \(oppositionSeats) \(Copy.seats)", parties: opposition)
                if let loose = fraktionslos {
                    NavigationLink(value: AppRoute.party(loose.slug)) {
                        HStack(spacing: ThemeTokens.Spacing.s) {
                            Text("\(Copy.fraktionslosLabel) · \(loose.seats) \(Copy.seats)").kicker()
                            Image(systemName: "arrow.right").font(.system(size: ThemeTokens.Icon.s))
                                .foregroundStyle(ThemeColor.secondary)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(ThemeTokens.Spacing.l)
        }
        .scrollDismissesKeyboard(.interactively)
        .onScrollGeometryChange(for: Double.self) { geo in
                    geo.contentOffset.y
                } action: { _, value in
                    scroll.y = value
        }
        .refreshable {
            await store.refresh(cache: cache)
            refreshTick += 1
        }
    }

    @ViewBuilder private func section(caption: String, parties: [PartyListItem]) -> some View {
        if !parties.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                Text(caption).kicker()
                VStack(spacing: ThemeTokens.Spacing.l) {
                    ForEach(parties) { party in
                        NavigationLink(value: AppRoute.party(party.slug)) {
                            PartyCardView(party: party, totalSeats: totalSeats)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var governing: [PartyListItem] {
        store.parties.filter { PartyStyle.hasPartyLine($0.party) && PartyStyle.isGoverning($0.party) }
    }

    private var opposition: [PartyListItem] {
        store.parties.filter { PartyStyle.hasPartyLine($0.party) && !PartyStyle.isGoverning($0.party) }
    }

    private var fraktionslos: PartyListItem? {
        store.parties.first { $0.party == "fraktionslos" }
    }

    private var totalSeats: Int {
        store.parties.reduce(0) { $0 + $1.seats }
    }

    private var governingSeats: Int {
        governing.reduce(0) { $0 + $1.seats }
    }

    private var oppositionSeats: Int {
        opposition.reduce(0) { $0 + $1.seats }
    }
}
