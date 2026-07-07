import SwiftUI

struct DefectorsSection: View {
    let defectors: [VoteDetailPayload.DefectorGroup]

    var body: some View {
        if !defectors.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
                Text(Copy.defectorsSection).kicker()
                ForEach(defectors) { group in
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(spacing: ThemeTokens.Spacing.s) {
                            if PartyStyle.hasLogo(group.party) {
                                PartyLogo(party: group.party, size: ThemeTokens.Icon.m)
                            } else {
                                Text(PartyStyle.label(group.party))
                                    .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                                    .foregroundStyle(ThemeColor.fg)
                            }
                            Text("\(Copy.majority): \(group.majority.label)").kicker()
                            Spacer(minLength: 0)
                        }
                        ForEach(Array(group.members.enumerated()), id: \.element.id) { index, member in
                            DefectorRow(member: member, showDivider: index > 0)
                        }
                    }
                }
            }
        }
    }
}
