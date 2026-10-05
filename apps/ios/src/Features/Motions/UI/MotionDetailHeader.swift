import SwiftUI

struct MotionDetailHeader: View {
    let detail: MotionDetailPayload
    let proposers: [String]
    let isLaenderInitiative: Bool
    let status: MotionStatusBucket
    let statusLabel: String

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                HStack(spacing: ThemeTokens.Spacing.s) {
                    if isLaenderInitiative {
                        Image(systemName: "building.columns")
                            .font(.system(size: ThemeTokens.Icon.m))
                            .foregroundStyle(ThemeColor.fg)
                            .accessibilityLabel(Copy.laenderMotion)
                    } else {
                        ForEach(proposers, id: \.self) { party in
                            ProposerKicker(party: party)
                                .accessibilityLabel(PartyStyle.label(party))
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                StampView(
                    label: statusLabel,
                    color: status == .angenommen ? ThemeColor.success
                        : status == .abgelehnt ? ThemeColor.danger
                        : status == .imVerfahren ? ThemeColor.blue : ThemeColor.secondary)
                Group {
                    if let date = detail.antrag.introducedDate {
                        Text(Formatters.shortDate(date)).kicker().lineLimit(1)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .trailing)
            }
            Text(detail.antrag.cleanTitle ?? detail.antrag.title)
                .font(.display(ThemeTokens.Text.xl))
                .multilineTextAlignment(.leading)
            if let clean = detail.antrag.cleanTitle, clean != detail.antrag.title {
                Text("\(Copy.officialTitleMotion): \(detail.antrag.title)")
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
            HStack(spacing: ThemeTokens.Spacing.s) {
                TopicChip(
                    text: detail.antrag.type == "gesetzentwurf" ? Copy.billTitle : Copy.motionTitle,
                    outlined: true)
                if let drucksache = detail.antrag.drucksache {
                    Text("\(Copy.drucksacheLabel) \(drucksache)").kicker()
                }
            }
            if isLaenderInitiative {
                Text("\(Copy.laenderMotion) · \(detail.antrag.initiativeFraktion ?? "")").kicker()
            }
            AntragSignatoryStrip(signatories: detail.signatories)
            if let simplified = detail.antrag.summarySimplified {
                MarkdownText(markdown: simplified, bodySize: ThemeTokens.Text.l)
            } else if let abstract = detail.antrag.abstract {
                Text(abstract).font(.serif(ThemeTokens.Text.l))
            }
        }
    }
}
