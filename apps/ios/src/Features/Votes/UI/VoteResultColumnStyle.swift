import SwiftUI

extension VoteResultColumn {
    var label: String {
        switch self {
        case .yes: return Copy.yes
        case .no: return Copy.no
        case .abstain: return Copy.resultAbstention
        case .absent: return Copy.resultAbsence
        case .unknown: return Copy.resultNoData
        }
    }

    var shortLabel: String {
        switch self {
        case .abstain: return Copy.resultAbstentionShort
        case .absent: return Copy.resultAbsenceShort
        default: return label
        }
    }

    var color: Color {
        switch self {
        case .yes: return ThemeColor.success
        case .no: return ThemeColor.danger
        case .abstain: return ThemeColor.yellow
        case .absent, .unknown: return ThemeColor.secondary
        }
    }
}
