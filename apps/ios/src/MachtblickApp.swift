import SwiftData
import SwiftUI

@main
struct MachtblickApp: App {
    let container: ModelContainer
    let cache: ApiCache
    @State private var appLanguage = AppLanguage.persisted
    @State private var appTheme = AppTheme.persisted
    @State private var motionLink: MotionLink?

    init() {
        container = try! ModelContainer(for: CachedPayload.self)
        cache = ApiCache(context: container.mainContext)
        FontRegistrar.registerBundledFonts()
    }

    var body: some Scene {
        WindowGroup {
            RootTabView(cache: cache, appLanguage: $appLanguage, appTheme: $appTheme)
                .preferredColorScheme(appTheme.colorScheme)
                .sheet(item: $motionLink) { link in
                    NavigationStack {
                        MotionDetailView(id: link.id, cache: cache)
                            .appDestinations(cache: cache)
                    }
                }
                .onOpenURL { url in
                    if url.scheme == "machtblick", url.host() == "motions",
                        let id = Int(url.lastPathComponent)
                    {
                        motionLink = MotionLink(id: id)
                    }
                }
                .environment(\.locale, appLanguage.resolved.locale)
        }
        .modelContainer(container)
    }
}
