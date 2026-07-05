import SwiftUI

struct SettingsView: View {
    let cache: ApiCache
    @State private var cleared = false

    var body: some View {
        List {
            Section(Copy.aboutSection) {
                Text(Copy.aboutText)
                    .font(.serif(ThemeTokens.Text.m))
            }
            Section(Copy.dataSection) {
                Link(Copy.website, destination: URL(string: "https://machtblick.de")!)
                Link(Copy.methodology, destination: URL(string: "https://machtblick.de/methodology/")!)
                Link(Copy.imprint, destination: URL(string: "https://machtblick.de/imprint/")!)
                Link(Copy.privacy, destination: URL(string: "https://machtblick.de/privacy/")!)
                Text(Copy.fontLicense)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
            Section(Copy.refreshSection) {
                HStack {
                    Text(Copy.lastRefresh)
                    Spacer()
                    Text(lastRefresh)
                        .foregroundStyle(ThemeColor.secondary)
                }
                Button(Copy.clearCache) {
                    cache.clear()
                    cleared = true
                }
                .foregroundStyle(ThemeColor.danger)
            }
        }
        .navigationTitle(Copy.moreTab)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var lastRefresh: String {
        if cleared { return Copy.never }
        if let date = cache.fetchedAt("/api/votes.json") {
            return date.formatted(date: .abbreviated, time: .shortened)
        }
        return Copy.never
    }
}
