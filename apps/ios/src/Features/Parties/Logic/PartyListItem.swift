import Foundation

struct PartyListItem: Decodable, Identifiable {
    let slug: String
    let party: String
    let seats: Int
    let cohesion: Double
    let attendance: Double

    var id: String { slug }
}
