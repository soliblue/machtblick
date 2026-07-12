import SwiftUI

struct PartyDonutHighlight {
    let party: String
    let color: Color
}

struct PartyDonutConnectorAnchors {
    var status: Anchor<CGPoint>? = nil
    var target: Anchor<CGPoint>? = nil
}

enum PartyDonutConnectorPreferenceKey: PreferenceKey {
    static var defaultValue: PartyDonutConnectorAnchors {
        PartyDonutConnectorAnchors()
    }

    static func reduce(
        value: inout PartyDonutConnectorAnchors,
        nextValue: () -> PartyDonutConnectorAnchors
    ) {
        let next = nextValue()
        value.status = next.status ?? value.status
        value.target = next.target ?? value.target
    }
}

struct PartyDonutRow: View {
    let summaries: [PartyVoteSummary]
    var highlight: PartyDonutHighlight? = nil

    var body: some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.s) {
            ForEach(PartyVoteOrder.byJaShare(summaries)) { summary in
                VStack(spacing: ThemeTokens.Spacing.xs) {
                    VoteDonutView(
                        yes: summary.yes,
                        no: summary.no,
                        abstain: summary.abstain,
                        absent: summary.absent,
                        position: summary.position
                    )
                    .frame(width: 44, height: 44)
                    .overlay {
                        if summary.party == highlight?.party {
                            Circle()
                                .stroke(
                                    highlight?.color.opacity(ThemeTokens.Opacity.l) ?? .clear,
                                    lineWidth: ThemeTokens.Stroke.l
                                )
                                .padding(-ThemeTokens.Stroke.l)
                        }
                    }
                    .anchorPreference(
                        key: PartyDonutConnectorPreferenceKey.self,
                        value: .top
                    ) { anchor in
                        PartyDonutConnectorAnchors(
                            target: summary.party == highlight?.party ? anchor : nil
                        )
                    }
                    Text(PartyStyle.label(summary.party))
                        .font(
                            .system(
                                size: ThemeTokens.Text.s,
                                weight: emphasized(summary) ? .semibold : .regular))
                        .textCase(.uppercase)
                        .foregroundStyle(emphasized(summary) ? ThemeColor.fg : ThemeColor.secondary)
                        .lineLimit(1)
                        .minimumScaleFactor(highlight == nil ? 0.8 : 0.65)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.top, highlight == nil ? 0 : ThemeTokens.Spacing.xl)
    }

    private func emphasized(_ summary: PartyVoteSummary) -> Bool {
        summary.position == .mixed || summary.position == .split
    }
}
