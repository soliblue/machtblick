import SwiftUI

struct ShareLinkButton: View {
    let title: String
    let url: URL

    var body: some View {
        ShareLink(item: url, subject: Text(title), message: Text(title)) {
            Image(systemName: "square.and.arrow.up")
        }
    }
}
