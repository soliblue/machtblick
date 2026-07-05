import SwiftUI

struct DebateSection: View {
    let debate: [VoteDetailPayload.DebateEntry]

    var body: some View {
        if !debate.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                Text(Copy.debateSection).kicker()
                ForEach(debate.sorted { $0.position < $1.position }) { entry in
                    if let memberId = entry.speakerMemberId {
                        NavigationLink(value: AppRoute.member(memberId)) {
                            DebateRow(entry: entry)
                        }
                        .buttonStyle(.plain)
                    } else {
                        DebateRow(entry: entry)
                    }
                }
            }
        }
    }
}

private struct DebateRow: View {
    let entry: VoteDetailPayload.DebateEntry

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                Circle()
                    .fill(PartyStyle.color(entry.party ?? ""))
                    .frame(width: 8, height: 8)
                Text(entry.speakerName)
                    .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                if let party = entry.party {
                    Text(PartyStyle.label(party))
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                }
                Spacer()
            }
            Text(entry.excerpt)
                .font(.serif(ThemeTokens.Text.m))
                .foregroundStyle(ThemeColor.fg)
                .lineLimit(4)
                .multilineTextAlignment(.leading)
        }
        .padding(.vertical, ThemeTokens.Spacing.s)
    }
}
