import SwiftUI

struct PartySurface: View {
    let party: String?
    var highlight = false
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        RoundedRectangle(cornerRadius: ThemeTokens.Radius.m)
            .fill(
                colorScheme == .dark
                    ? ThemeColor.surface
                    : party.map { PartyStyle.color($0).opacity(0.13) } ?? ThemeColor.surface
            )
            .overlay {
                if colorScheme == .dark, let party {
                    RoundedRectangle(cornerRadius: ThemeTokens.Radius.m)
                        .fill(PartyStyle.color(party).opacity(ThemeTokens.Opacity.s))
                }
            }
            .overlay {
                if colorScheme == .dark || highlight {
                    RoundedRectangle(cornerRadius: ThemeTokens.Radius.m)
                        .stroke(
                            party.map {
                                PartyStyle.color($0).opacity(
                                    highlight ? ThemeTokens.Opacity.l : ThemeTokens.Opacity.m)
                            } ?? ThemeColor.fg.opacity(
                                highlight ? ThemeTokens.Opacity.m : ThemeTokens.Opacity.s),
                            lineWidth: highlight ? ThemeTokens.Stroke.l : ThemeTokens.Stroke.s
                        )
                }
            }
    }
}
