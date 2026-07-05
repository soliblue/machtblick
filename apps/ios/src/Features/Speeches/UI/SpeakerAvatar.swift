import SwiftUI

struct SpeakerAvatar: View {
    let name: String
    let pictureUrl: String?
    var size: CGFloat = 36

    var body: some View {
        AsyncImage(url: HTTPClient.absolute(pictureUrl)) { phase in
            if let image = phase.image {
                image.resizable().scaledToFill()
            } else {
                Text(initials)
                    .font(.system(size: size * 0.34, weight: .semibold))
                    .foregroundStyle(ThemeColor.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(ThemeColor.surface)
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }

    private var initials: String {
        String(name.split(separator: " ").compactMap(\.first).prefix(2))
    }
}
