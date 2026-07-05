import Foundation

struct PartyVoteSummary: Decodable, Identifiable {
    let party: String
    let position: PartyPosition
    let members: Int?
    let yes: Int
    let no: Int
    let abstain: Int
    let absent: Int

    var id: String { party }

    var memberCount: Int {
        members ?? (yes + no + abstain + absent)
    }

    var jaShare: Double {
        Double(yes - no) / Double(max(yes + no + abstain, 1))
    }

    func count(_ choice: VoteChoice) -> Int {
        switch choice {
        case .yes: return yes
        case .no: return no
        case .abstain: return abstain
        case .absent: return absent
        }
    }
}

enum PartyVoteOrder {
    static func byJaShare(_ summaries: [PartyVoteSummary]) -> [PartyVoteSummary] {
        summaries
            .filter { PartyStyle.hasPartyLine($0.party) }
            .sorted { $0.jaShare > $1.jaShare }
    }
}
