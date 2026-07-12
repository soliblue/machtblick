import SwiftUI

struct MemberBallotBadge: View {
    let choice: BallotChoice

    var body: some View {
        Text(choice.label)
            .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
            .textCase(.uppercase)
            .foregroundStyle(choice.pillText)
            .padding(.horizontal, ThemeTokens.Spacing.s)
            .padding(.vertical, ThemeTokens.Spacing.xs)
            .background(
                RoundedRectangle(cornerRadius: ThemeTokens.Radius.s)
                    .fill(
                        choice == .nichtAbgegeben
                            ? ThemeColor.fg.opacity(ThemeTokens.Opacity.s)
                            : choice.color
                    )
            )
    }
}
