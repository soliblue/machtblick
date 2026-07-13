import SwiftUI

extension View {
    @ViewBuilder
    func appStoreScreenshotReady() -> some View {
#if DEBUG
        if let scenario = AppStoreScreenshotScenario.current {
            accessibilityIdentifier(scenario.readyIdentifier)
        } else {
            self
        }
#else
        self
#endif
    }
}
