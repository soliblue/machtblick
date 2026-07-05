import Foundation

struct VoteListItem: Decodable, Identifiable {
    let id: String
    let title: String
    let cleanTitle: String
    let date: String
    let result: VoteResult
    let initiator: String?
    let yes: Int
    let no: Int
    let abstain: Int
    let absent: Int

    var totalMembers: Int {
        yes + no + abstain + absent
    }
}
