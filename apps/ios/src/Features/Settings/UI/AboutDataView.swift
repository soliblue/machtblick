import SwiftUI

struct AboutDataView: View {
    var body: some View {
        SettingsReadingPage(content: AboutDataContent.content(), backLabel: Copy.moreTab)
    }
}
