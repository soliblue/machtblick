import Foundation

enum Stance: String {
    case yes
    case no
    case abstain
    case split
}

struct PartySummaryReader: Identifiable {
    let party: String
    let stance: Stance
    let positionSummary: String?
    let keyPoints: String?
    let dissentNote: String?

    var id: String { party }
}

enum ReaderItem: Identifiable {
    case speech(SpeechSummary)
    case summary(PartySummaryReader)

    var id: String {
        switch self {
        case .speech(let speech): return "speech-\(speech.id)"
        case .summary(let summary): return "summary-\(summary.party)"
        }
    }
}

enum StanceRules {
    static func of(yes: Int, no: Int, abstain: Int) -> Stance {
        if abstain > yes && abstain > no { return .abstain }
        if yes > no { return .yes }
        if no > yes { return .no }
        return .split
    }
}
