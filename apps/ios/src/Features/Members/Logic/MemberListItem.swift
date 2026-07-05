import Foundation

struct MemberListItem: Decodable, Identifiable {
    let id: String
    let name: String
    let party: String
    let state: String
    let yearOfBirth: Int?
    let sex: String?
    let mandateType: String?

    var lastName: String {
        name.split(separator: " ").last.map(String.init) ?? name
    }
}

enum MemberLabels {
    static func sex(_ key: String) -> String {
        switch key {
        case "m": return Copy.sexMale
        case "f": return Copy.sexFemale
        case "d": return Copy.sexDivers
        default: return Copy.unknown
        }
    }

    static func mandate(_ key: String) -> String {
        key == "direkt" ? Copy.mandateDirekt : Copy.mandateListe
    }
}
