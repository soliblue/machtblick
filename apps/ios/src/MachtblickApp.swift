import SwiftData
import SwiftUI

@main
struct MachtblickApp: App {
    let container: ModelContainer
    let cache: ApiCache
    @State private var appLanguage: AppLanguage
    @State private var appTheme: AppTheme
    @State private var motionLink: MotionLink?

    init() {
        let screenshot = AppStoreScreenshotScenario.current
        let language = screenshot == nil ? AppLanguage.persisted : AppStoreScreenshotScenario.appLanguage
        let theme = screenshot == nil ? AppTheme.persisted : .light
        if screenshot != nil {
            AppLanguage.persisted = language
            AppTheme.persisted = theme
        }
        _appLanguage = State(initialValue: language)
        _appTheme = State(initialValue: theme)
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
