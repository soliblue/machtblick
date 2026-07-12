import SwiftUI

struct ImprintView: View {
    let backLabel: String

    init(backLabel: String = Copy.moreTab) {
        self.backLabel = backLabel
    }

    var body: some View {
        SettingsReadingPage(content: ImprintContent.content(), backLabel: backLabel)
    }
}
