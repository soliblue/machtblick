import SwiftUI

struct AlignmentList: View {
    let alignments: [PartyDetailPayload.Alignment]

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            Text(Copy.alignmentsSection).kicker()
            ForEach(alignments) { alignment in
                NavigationLink(value: AppRoute.party(PartyStyle.slug(alignment.party))) {
                    row(alignment)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func row(_ alignment: PartyDetailPayload.Alignment) -> some View {
        HStack(spacing: ThemeTokens.Spacing.m) {
            Circle().fill(PartyStyle.color(alignment.party)).frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Rectangle().fill(ThemeColor.border)
                        Rectangle().fill(ThemeColor.success)
                            .frame(width: geo.size.width * min(max(alignment.agreement, 0), 1))
                    }
                }
                .frame(height: 3)
                Text("\(Formatters.percent(alignment.agreement)) \(Copy.beiWord) \(alignment.sharedVotes) \(Copy.sharedVotesSuffix)")
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
            Text(Formatters.percent(alignment.agreement))
                .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                .monospacedDigit()
                .frame(width: 48, alignment: .trailing)
        }
    }
}
