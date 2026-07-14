import SwiftUI

struct MemberCardView: View {
    let member: MemberListItem

    var body: some View {
        Color.clear
            .aspectRatio(3.0 / 4.0, contentMode: .fit)
            .overlay(photo)
            .overlay(alignment: .topTrailing) { partyMark }
            .clipShape(RoundedRectangle(cornerRadius: ThemeTokens.Radius.m))
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("\(member.name), \(PartyStyle.label(member.party))")
    }

    @ViewBuilder private var photo: some View {
        if let localUrl = HTTPClient.memberPhoto(member.id) {
            AsyncImage(url: localUrl) { phase in
                if let image = phase.image {
                    loadedPhoto(image)
                } else if phase.error != nil,
                    let fallbackUrl = HTTPClient.absolute(member.pictureUrl),
                    fallbackUrl.absoluteURL != localUrl.absoluteURL
                {
                    AsyncImage(url: fallbackUrl) { fallbackPhase in
                        if let image = fallbackPhase.image {
                            loadedPhoto(image)
                        } else {
                            initialsPhoto
                        }
                    }
                } else {
                    initialsPhoto
                }
            }
        } else {
            initialsPhoto
        }
    }

    private func loadedPhoto(_ image: Image) -> some View {
        Color.clear
            .overlay { image.resizable().scaledToFill() }
            .clipped()
            .overlay(
                LinearGradient(
                    colors: [.clear, .clear, .black.opacity(0.65)],
                    startPoint: .top, endPoint: .bottom))
            .overlay(alignment: .bottomLeading) { nameLabel(color: .white) }
    }

    private var initialsPhoto: some View {
        Text(initials)
            .font(.display(ThemeTokens.Text.xxl))
            .foregroundStyle(ThemeColor.fg)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(
                [
                    ThemeColor.blue, ThemeColor.purple, ThemeColor.orange, ThemeColor.cyan,
                    ThemeColor.pink, ThemeColor.teal, ThemeColor.indigo, ThemeColor.rust,
                ][member.id.utf8.reduce(0) { ($0 * 31 + Int($1)) % 8 }]
                    .mix(with: ThemeColor.background, by: ThemeTokens.Opacity.m))
            .overlay(alignment: .bottomLeading) { nameLabel(color: ThemeColor.fg) }
    }

    private func nameLabel(color: Color) -> some View {
        Text(member.name)
            .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
            .foregroundStyle(color)
            .lineLimit(1)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, ThemeTokens.Spacing.s)
            .padding(.vertical, ThemeTokens.Spacing.xs)
    }

    @ViewBuilder private var partyMark: some View {
        if PartyStyle.hasLogo(member.party) {
            PartyLogo(party: member.party, size: ThemeTokens.Icon.m)
                .padding(ThemeTokens.Spacing.s)
        } else {
            Circle()
                .fill(PartyStyle.color(member.party))
                .frame(width: 10, height: 10)
                .padding(ThemeTokens.Spacing.s)
        }
    }

    private var initials: String {
        String(member.name.split(separator: " ").compactMap(\.first).prefix(2))
    }
}
