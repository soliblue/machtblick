import SwiftUI

extension VoteResult {
    var color: Color {
        self == .angenommen ? ThemeColor.success : ThemeColor.danger
    }

    var label: String {
        self == .angenommen ? Copy.accepted : Copy.rejected
    }
}

extension BallotChoice {
    var color: Color {
        switch self {
        case .ja: return ThemeColor.success
        case .nein: return ThemeColor.danger
        case .enthalten: return ThemeColor.yellow
        case .nichtAbgegeben: return ThemeColor.fg.opacity(ThemeTokens.Opacity.m)
        }
    }

    var label: String {
        switch self {
        case .ja: return Copy.yes
        case .nein: return Copy.no
        case .enthalten: return Copy.abstain
        case .nichtAbgegeben: return Copy.absent
        }
    }
}

extension PartyPosition {
    var color: Color {
        switch self {
        case .yes: return ThemeColor.success
        case .no: return ThemeColor.danger
        case .abstain: return ThemeColor.yellow
        case .mixed, .split: return ThemeColor.fg
        }
    }

    var label: String {
        switch self {
        case .yes: return Copy.positionYes
        case .no: return Copy.positionNo
        case .abstain: return Copy.positionAbstain
        case .mixed, .split: return Copy.positionMixed
        }
    }
}
