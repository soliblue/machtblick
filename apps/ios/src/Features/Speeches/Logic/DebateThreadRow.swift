import Foundation

enum DebateThreadRow: Identifiable {
    case system(SpeechSummary)
    case turn(speech: SpeechSummary, nested: Bool, compact: Bool, turnIndex: Int)

    var id: String {
        switch self {
        case .system(let speech): return speech.id
        case .turn(let speech, _, _, _): return speech.id
        }
    }
}

enum DebateThreadBuilder {
    private static func isPresidium(_ speech: SpeechSummary) -> Bool {
        guard let role = speech.speakerRole else { return false }
        return role.range(of: "^(alters|vize)?präsident", options: [.regularExpression, .caseInsensitive])
            != nil
    }

    static func rows(from speeches: [SpeechSummary]) -> [DebateThreadRow] {
        let turns = speeches.filter { !isPresidium($0) }
        let speakerKey = { (speech: SpeechSummary) in speech.speakerMemberId ?? speech.speakerName }
        var nestedIds: Set<String> = []
        var floor: String?
        for (index, turn) in turns.enumerated() {
            let key = speakerKey(turn)
            if floor == nil || key == floor {
                floor = key
            } else if turns[(index + 1)..<min(index + 3, turns.count)].contains(where: {
                speakerKey($0) == floor
            }) {
                nestedIds.insert(turn.id)
            } else {
                floor = key
            }
        }
        var turnIndex = 0
        return speeches.map { speech in
            if isPresidium(speech) {
                return .system(speech)
            }
            let nested = nestedIds.contains(speech.id)
            let row = DebateThreadRow.turn(
                speech: speech, nested: nested,
                compact: speech.contributionType == "short" && !nested, turnIndex: turnIndex)
            turnIndex += 1
            return row
        }
    }
}
