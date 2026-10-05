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
}
