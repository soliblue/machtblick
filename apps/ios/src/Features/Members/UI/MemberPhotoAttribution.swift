import Foundation
import SwiftUI

struct MemberPhotoAttribution: View {
    let author: String
    let license: String
    let sourceUrl: String?
    @State private var browser: BrowserDestination?

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            Text(Copy.photoAttribution).kicker()
            Text(Copy.photoCredit(author: author, license: license))
                .font(.system(size: ThemeTokens.Text.m))
                .foregroundStyle(ThemeColor.fg)
                .fixedSize(horizontal: false, vertical: true)
            if let sourceUrl, let url = HTTPClient.absolute(sourceUrl) {
                Button(Copy.photoSource) {
                    browser = BrowserDestination(url: url)
                }
                .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                .foregroundStyle(ThemeColor.fg)
                .underline()
                .buttonStyle(.plain)
            }
        }
        .padding(ThemeTokens.Spacing.l)
        .frame(maxWidth: 280, alignment: .leading)
        .presentationBackground(ThemeColor.background)
        .sheet(item: $browser) { destination in
            InAppBrowser(url: destination.url)
                .ignoresSafeArea()
        }
    }
}
