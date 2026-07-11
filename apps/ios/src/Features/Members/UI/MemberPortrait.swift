import SwiftUI

struct MemberPortrait: View {
    let detail: MemberDetailPayload

    @State private var showsAttribution = false

    private var hasAttribution: Bool {
        detail.pictureUrl != nil && detail.pictureAuthor != nil && detail.pictureLicense != nil
    }

    var body: some View {
        MemberAvatar(
            name: detail.name,
            url: HTTPClient.absolute(detail.pictureUrl),
            size: 112,
            circle: true
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(detail.name)
        .overlay(alignment: .bottomTrailing) {
            if hasAttribution {
                Button {
                    showsAttribution = true
                } label: {
                    Image(systemName: "info.circle")
                        .font(.system(size: ThemeTokens.Icon.s))
                        .foregroundStyle(ThemeColor.fg)
                        .frame(width: 32, height: 32)
                        .background(Circle().fill(ThemeColor.background))
                        .overlay(Circle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(
                    Copy.photoCredit(
                        author: detail.pictureAuthor ?? "", license: detail.pictureLicense ?? "")
                )
                .popover(isPresented: $showsAttribution, arrowEdge: .top) {
                    MemberPhotoAttribution(
                        author: detail.pictureAuthor ?? "",
                        license: detail.pictureLicense ?? "",
                        sourceUrl: detail.pictureSourceUrl
                    )
                    .presentationCompactAdaptation(.popover)
                }
            }
        }
        .frame(width: 112, height: 112)
    }
}
