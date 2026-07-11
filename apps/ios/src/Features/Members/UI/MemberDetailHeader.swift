import Foundation
import SwiftUI

struct MemberDetailHeader: View {
    let detail: MemberDetailPayload

    private var metadata: [String] {
        var items: [String] = []
        if !detail.state.isEmpty { items.append(detail.state) }
        if let mandateType = detail.mandateType { items.append(MemberLabels.mandate(mandateType)) }
        if detail.mandateType == "direkt", let constituencyName = detail.constituencyName {
            items.append(Copy.constituencyLabel(constituencyName))
        }
        if let yearOfBirth = detail.yearOfBirth {
            items.append(Copy.memberAge(Calendar.current.component(.year, from: Date()) - yearOfBirth))
        }
        if let education = detail.education, !education.isEmpty { items.append(education) }
        return items
    }

    var body: some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.l) {
            MemberPortrait(detail: detail)
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                HStack(spacing: ThemeTokens.Spacing.s) {
                    if PartyStyle.hasLogo(detail.party) {
                        PartyLogo(party: detail.party, size: ThemeTokens.Icon.l)
                    } else {
                        Text(PartyStyle.label(detail.party))
                            .font(.system(size: ThemeTokens.Text.s))
                            .foregroundStyle(ThemeColor.secondary)
                            .lineLimit(1)
                    }
                    Text(detail.name)
                        .font(.display(ThemeTokens.Text.xxl))
                        .foregroundStyle(ThemeColor.fg)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                    ForEach(metadata, id: \.self) { item in
                        Text(item)
                            .kicker()
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
