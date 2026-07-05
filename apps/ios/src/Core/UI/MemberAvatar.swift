import SwiftUI

struct MemberAvatar: View {
    let name: String
    let url: URL?
    var size: CGFloat = 56

    var body: some View {
        AsyncImage(url: url) { phase in
            if let image = phase.image {
                image.resizable().scaledToFill()
            } else {
                Text(initials)
                    .font(.display(size * 0.32))
                    .foregroundStyle(ThemeColor.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(ThemeColor.surface)
            }
        }
        .frame(width: size, height: size)
        .clipped()
    }

    private var initials: String {
        String(name.split(separator: " ").compactMap(\.first).prefix(2))
    }
}
