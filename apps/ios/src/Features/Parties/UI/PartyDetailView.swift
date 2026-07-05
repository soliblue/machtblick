import SwiftUI

private enum PartyTab: Hashable {
    case profile
    case votes
}

struct PartyDetailView: View {
    let slug: String
    let cache: ApiCache
    @State private var store = PartyDetailStore()
    @State private var tab: PartyTab = .profile

    var body: some View {
        Group {
            if let detail = store.detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
                        header(detail)
                        picker(detail)
                        panel(detail)
                    }
                    .padding(ThemeTokens.Spacing.l)
                }
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(ThemeColor.background)
        .navigationBarTitleDisplayMode(.inline)
        .task { await store.load(slug: slug, cache: cache) }
    }

    private func header(_ detail: PartyDetailPayload) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                Circle().fill(PartyStyle.color(detail.party)).frame(width: 14, height: 14)
                Text(PartyStyle.label(detail.party))
                    .font(.display(ThemeTokens.Text.xxl))
            }
            Text(meta(detail)).kicker()
            HStack(alignment: .top, spacing: ThemeTokens.Spacing.l) {
                PosterStatBar(
                    label: Copy.cohesion, value: cohesion(detail),
                    sub: (text: "\(detail.votes.count) \(Copy.votesSection)", danger: false)
                )
                .frame(maxWidth: .infinity, alignment: .leading)
                PosterStatBar(label: Copy.attendance, value: attendance(detail))
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private func meta(_ detail: PartyDetailPayload) -> String {
        var parts: [String] = []
        if PartyStyle.hasPartyLine(detail.party) {
            parts.append(PartyStyle.isGoverning(detail.party) ? Copy.govLabel : Copy.oppositionLabel)
        }
        parts.append("\(seats(detail)) \(Copy.seats)")
        return parts.joined(separator: " · ")
    }

    private func seats(_ detail: PartyDetailPayload) -> Int {
        store.lean?.seats ?? detail.seats
    }

    private func cohesion(_ detail: PartyDetailPayload) -> Double {
        store.lean?.cohesion ?? detail.cohesion
    }

    private func attendance(_ detail: PartyDetailPayload) -> Double {
        store.lean?.attendance ?? detail.attendance
    }

    private func tabs(_ detail: PartyDetailPayload) -> [PartyTab] {
        detail.votes.isEmpty ? [.profile] : [.profile, .votes]
    }

    private func tabLabel(_ tab: PartyTab) -> String {
        tab == .profile ? Copy.tabProfile : Copy.votesSection
    }

    @ViewBuilder private func picker(_ detail: PartyDetailPayload) -> some View {
        let available = tabs(detail)
        if available.count > 1 {
            Picker("", selection: $tab) {
                ForEach(available, id: \.self) { Text(tabLabel($0)).tag($0) }
            }
            .pickerStyle(.segmented)
        }
    }

    @ViewBuilder private func panel(_ detail: PartyDetailPayload) -> some View {
        let active = tabs(detail).contains(tab) ? tab : .profile
        switch active {
        case .profile: PartyProfilePanel(detail: detail, members: store.members)
        case .votes: PartyVotesPanel(votes: detail.votes)
        }
    }
}
