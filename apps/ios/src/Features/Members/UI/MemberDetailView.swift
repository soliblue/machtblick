import SwiftUI

struct MemberDetailView: View {
    let id: String
    let cache: ApiCache

    @State private var store = MemberDetailStore()

    var body: some View {
        ZStack {
            ThemeColor.background.ignoresSafeArea()
            if let detail = store.detail {
                MemberDetailContent(detail: detail, cache: cache)
                    .appStoreScreenshotReady()
            } else if store.loadFailed {
                ErrorStateView(message: Copy.loadError) {
                    Task { await store.load(id: id, cache: cache) }
                }
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let detail = store.detail {
                ToolbarItem(placement: .topBarTrailing) {
                    ShareLinkButton(title: detail.name, url: HTTPClient.page("/members/\(id)"))
                }
            }
        }
        .task { await store.load(id: id, cache: cache) }
    }
}
