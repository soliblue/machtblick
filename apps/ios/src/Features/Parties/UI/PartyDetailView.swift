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
                        stats(detail)
                        donations(detail)
                        alignments(detail)
                        votes(detail)
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
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                Circle()
                    .fill(PartyStyle.color(detail.party))
                    .frame(width: 12, height: 12)
                Text(PartyStyle.label(detail.party))
                    .font(.display(ThemeTokens.Text.xxl))
            }
            HStack(alignment: .firstTextBaseline, spacing: ThemeTokens.Spacing.s) {
                Text("\(seats(detail))")
                    .font(.display(40))
                    .monospacedDigit()
                Text(Copy.seats).kicker()
            }
        }
    }

    private func seats(_ detail: PartyDetailPayload) -> Int {
        store.lean?.seats ?? detail.seats
    }

    private func stats(_ detail: PartyDetailPayload) -> some View {
        VStack(spacing: ThemeTokens.Spacing.m) {
            StatBar(label: Copy.cohesion, value: store.lean?.cohesion ?? detail.cohesion)
            StatBar(label: Copy.attendance, value: store.lean?.attendance ?? detail.attendance)
        }
    }

    @ViewBuilder
    private func donations(_ detail: PartyDetailPayload) -> some View {
        if !detail.donations.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                HStack {
                    Text(Copy.donationsSection).kicker()
                    Spacer()
                    Text("\(Copy.donationsTotal): \(Formatters.euro(detail.donationsTotalEur))")
                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                        .monospacedDigit()
                }
                ForEach(detail.donations) { donation in
                    HStack(alignment: .firstTextBaseline, spacing: ThemeTokens.Spacing.s) {
                        Text(donation.donor)
                            .font(.system(size: ThemeTokens.Text.m))
                            .lineLimit(2)
                        Spacer()
                        VStack(alignment: .trailing, spacing: ThemeTokens.Spacing.xs) {
                            Text(Formatters.euro(donation.amountEur))
                                .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                                .monospacedDigit()
                            Text(Formatters.shortDate(donation.dateReceived)).kicker()
                        }
                    }
                    .padding(.vertical, ThemeTokens.Spacing.xs)
                }
            }
        }
    }

    @ViewBuilder
    private func alignments(_ detail: PartyDetailPayload) -> some View {
        if !detail.alignments.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                Text(Copy.alignmentsSection).kicker()
                ForEach(detail.alignments) { alignment in
                    StatBar(label: PartyStyle.label(alignment.party), value: alignment.agreement)
                }
            }
        }
    }

    @ViewBuilder
    private func votes(_ detail: PartyDetailPayload) -> some View {
        if !detail.votes.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                Text(Copy.votesSection).kicker()
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(detail.votes) { vote in
                        PartyVoteRow(vote: vote)
                    }
                }
            }
        }
    }
}
