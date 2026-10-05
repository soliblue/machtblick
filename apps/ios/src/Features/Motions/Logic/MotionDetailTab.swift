import Foundation

enum MotionDetailTab: Hashable {
    case result
    case details
    case speeches

    var label: String {
        switch self {
        case .result: return Copy.tabResult
        case .details: return Copy.tabDetails
        case .speeches: return Copy.tabSpeeches
        }
    }
}
