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
        case .nichtAbgegeben: return Copy.notCast
        }
    }
}

extension BallotChoice {
    var pillFill: Color? {
        switch self {
        case .ja: return ThemeColor.success
        case .nein: return ThemeColor.danger
        case .enthalten: return ThemeColor.yellow
        case .nichtAbgegeben: return nil
        }
    }

    var pillText: Color {
        switch self {
        case .ja: return ThemeColor.onSuccess
        case .nein: return ThemeColor.onDanger
        case .enthalten: return ThemeColor.onYellow
        case .nichtAbgegeben: return ThemeColor.fg
        }
    }
}

extension PartyPosition {
    var pillFill: Color? {
        switch self {
        case .yes: return ThemeColor.success
        case .no: return ThemeColor.danger
        case .abstain: return ThemeColor.yellow
        case .mixed, .split: return nil
        }
    }

    var pillText: Color {
        switch self {
        case .yes: return ThemeColor.onSuccess
        case .no: return ThemeColor.onDanger
        case .abstain: return ThemeColor.onYellow
        case .mixed, .split: return ThemeColor.fg
        }
    }
}

extension VoteChoice {
    var color: Color {
        switch self {
        case .yes: return ThemeColor.success
        case .no: return ThemeColor.danger
        case .abstain: return ThemeColor.yellow
        case .absent: return ThemeColor.fg.opacity(ThemeTokens.Opacity.m)
        }
    }

    var label: String {
        switch self {
        case .yes: return Copy.yes
        case .no: return Copy.no
        case .abstain: return Copy.abstain
        case .absent: return Copy.absent
        }
    }
}

extension Stance {
    var color: Color {
        switch self {
        case .yes: return ThemeColor.success
        case .no: return ThemeColor.danger
        case .abstain: return ThemeColor.yellow
        case .split: return ThemeColor.fg
        }
    }

    var label: String {
        switch self {
        case .yes: return Copy.positionYes
        case .no: return Copy.positionNo
        case .abstain: return Copy.positionAbstain
        case .split: return Copy.positionMixed
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
