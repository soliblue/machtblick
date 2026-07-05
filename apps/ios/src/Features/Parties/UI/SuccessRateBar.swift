import SwiftUI

struct SuccessRateBar: View {
    let rate: Double
    let matched: Int?
    let decided: Int?

    var body: some View {
        PosterStatBar(label: Copy.successRateLabel, value: rate, sub: sub)
    }

    private var sub: (text: String, danger: Bool)? {
        guard let matched, let decided else { return nil }
        return (text: "\(matched) \(Copy.vonWord) \(decided) \(Copy.resultsMatchedSuffix)", danger: false)
    }
}
