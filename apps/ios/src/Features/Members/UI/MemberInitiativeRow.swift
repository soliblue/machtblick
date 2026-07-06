import SwiftUI

struct MemberInitiativeRow: View {
    let initiative: MemberDetailPayload.Initiative
    var showDivider = true

    var body: some View {
        NavigationLink(value: route) {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                Text(initiative.cleanTitle ?? initiative.title)
                    .font(.display(ThemeTokens.Text.l))
                    .foregroundStyle(ThemeColor.fg)
                    .multilineTextAlignment(.leading)
                HStack(spacing: ThemeTokens.Spacing.s) {
                    if let vote = initiative.linkedVotes.first {
                        ResultChip(result: vote.result, date: vote.date)
                    } else if let stand = initiative.beratungsstand {
                        TopicChip(text: statusLabel(stand), outlined: true, danger: stand == "Abgelehnt")
                    }
                    if let date = initiative.introducedDate {
                        Text(Formatters.shortDate(date)).kicker()
                    }
                    Text("\(initiative.signatoryCount) \(Copy.signatoriesSuffix)").kicker()
                }
                if !initiative.sachgebiet.isEmpty {
                    HStack(spacing: ThemeTokens.Spacing.xs) {
                        ForEach(Array(initiative.sachgebiet.prefix(3)), id: \.self) { topic in
                            TopicChip(text: topic)
                        }
                    }
                }
            }
            .padding(.vertical, ThemeTokens.Spacing.m)
            .frame(maxWidth: .infinity, alignment: .leading)
            .overlay(alignment: .top) {
                if showDivider {
                    Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var route: AppRoute {
        initiative.linkedVotes.first.map { AppRoute.vote($0.voteId) } ?? AppRoute.motion(initiative.antragId)
    }

    private func statusLabel(_ stand: String) -> String {
        switch stand {
        case "Beschlussempfehlung liegt vor": return Copy.stampBeschlussempfehlung
        case "Noch nicht beraten": return Copy.stampNichtBeraten
        default: return stand
        }
    }
}
