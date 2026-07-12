import SwiftUI

struct PrivacyView: View {
    var body: some View {
        SettingsReadingPage(content: PrivacyContent.content(), backLabel: Copy.moreTab)
    }
}
