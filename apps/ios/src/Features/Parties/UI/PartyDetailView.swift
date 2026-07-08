import SwiftUI

struct PartyDetailView: View {
    let slug: String
    let cache: ApiCache
    @State private var store = PartyDetailStore()

    var body: some View {
        Group {
            if let detail = store.detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
                        header(detail)
                        demographics(detail)
                        PartyProfilePanel(detail: detail, cache: cache)
                        history(detail)
                    }
                    .padding(ThemeTokens.Spacing.l)
                }
                .scrollDismissesKeyboard(.interactively)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        ShareLinkButton(
                            title: PartyStyle.label(detail.party), url: HTTPClient.page("/parties/\(slug)"))
                    }
                }
            } else if store.loadFailed {
                ErrorStateView(message: Copy.loadError) { Task { await store.load(slug: slug, cache: cache) } }
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(ThemeColor.background)
        .navigationBarTitleDisplayMode(.inline)
        .task { await store.load(slug: slug, cache: cache) }
    }

    @ViewBuilder private func history(_ detail: PartyDetailPayload) -> some View {
        if let history = detail.history, history.chartPoints.count >= 2 {
            PartyHistoryPanel(history: history, party: detail.party)
        }
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

    @ViewBuilder private func demographics(_ detail: PartyDetailPayload) -> some View {
        let partyMembers = store.members.filter { $0.party == detail.party }
        if !partyMembers.isEmpty {
            DemographicsStrip(members: partyMembers, showFaction: false)
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
}
