import SwiftUI

struct PartyLineFingerprint: View {
    let votes: [PartyDetailPayload.VoteEntry]
    @Binding var selected: PartyPosition?

    private let keys: [PartyPosition] = [.yes, .no, .abstain, .split]

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            Text(Copy.partyLineLabel).kicker()
            GeometryReader { geo in
                HStack(spacing: 2) {
                    ForEach(present, id: \.self) { key in
                        Button { selected = selected == key ? nil : key } label: {
                            Rectangle()
                                .fill(color(key).opacity(selected == nil || selected == key ? 1 : ThemeTokens.Opacity.s))
                                .frame(width: width(key, in: geo.size.width))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .frame(height: 32)
            HStack(spacing: ThemeTokens.Spacing.s) {
                ForEach(present, id: \.self) { key in
                    HStack(spacing: ThemeTokens.Spacing.xs) {
                        Text("\(count(key))")
                            .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                            .monospacedDigit()
                        Text(label(key))
                            .font(.system(size: ThemeTokens.Text.s))
                            .foregroundStyle(ThemeColor.secondary)
                    }
                }
            }
        }
    }

    static func key(_ position: PartyPosition) -> PartyPosition {
        position == .mixed ? .split : position
    }

    private var present: [PartyPosition] {
        keys.filter { count($0) > 0 }
    }

    private func count(_ key: PartyPosition) -> Int {
        votes.filter { Self.key($0.partyVote) == key }.count
    }

    private func width(_ key: PartyPosition, in total: CGFloat) -> CGFloat {
        let sum = present.reduce(0) { $0 + count($1) }
        let gaps = CGFloat(max(present.count - 1, 0)) * 2
        return (total - gaps) * CGFloat(count(key)) / CGFloat(max(sum, 1))
    }

    private func color(_ key: PartyPosition) -> Color {
        switch key {
        case .yes: return ThemeColor.success
        case .no: return ThemeColor.danger
        case .abstain: return ThemeColor.yellow
        case .mixed, .split: return ThemeColor.fg.opacity(ThemeTokens.Opacity.m)
        }
    }

    private func label(_ key: PartyPosition) -> String {
        switch key {
        case .yes: return Copy.yes
        case .no: return Copy.no
        case .abstain: return Copy.abstain
        case .mixed, .split: return Copy.positionMixed
        }
    }
}
