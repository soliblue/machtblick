import SwiftUI

struct MemberCardView: View {
    let member: MemberListItem

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Color.clear
                .aspectRatio(1, contentMode: .fit)
                .overlay(photo)
                .clipped()
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                Text(member.name)
                    .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                    .lineLimit(2, reservesSpace: true)
                    .multilineTextAlignment(.leading)
                HStack(spacing: ThemeTokens.Spacing.xs) {
                    Circle()
                        .fill(PartyStyle.color(member.party))
                        .frame(width: 8, height: 8)
                    Text(PartyStyle.label(member.party))
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                        .lineLimit(1)
                }
            }
            .padding(ThemeTokens.Spacing.s)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
    }

    private var photo: some View {
        AsyncImage(url: HTTPClient.memberPhoto(member.id)) { phase in
            if let image = phase.image {
                image.resizable().scaledToFill()
            } else {
                Text(initials)
                    .font(.display(ThemeTokens.Text.xxl))
                    .foregroundStyle(ThemeColor.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(ThemeColor.surface)
            }
        }
    }

    private var initials: String {
        String(member.name.split(separator: " ").compactMap(\.first).prefix(2))
    }
}
