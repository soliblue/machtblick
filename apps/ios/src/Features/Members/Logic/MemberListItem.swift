import Foundation

struct MemberListItem: Decodable, Identifiable {
    let id: String
    let name: String
    let party: String
    let state: String
    let yearOfBirth: Int?
    let sex: String?
    let mandateType: String?
}
