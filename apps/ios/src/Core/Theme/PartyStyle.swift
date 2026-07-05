import SwiftUI

enum PartyStyle {
    static let order = ["CDU/CSU", "SPD", "AfD", "B90/Grüne", "Die Linke", "fraktionslos"]
    static let seatingOrder = ["Die Linke", "B90/Grüne", "SPD", "fraktionslos", "CDU/CSU", "AfD"]

    static func color(_ party: String) -> Color {
        switch party {
        case "CDU/CSU": return ThemeColor.gray
        case "SPD": return ThemeColor.red
        case "AfD": return ThemeColor.blue
        case "B90/Grüne": return ThemeColor.green
        case "Die Linke": return ThemeColor.purple
        case "fraktionslos": return ThemeColor.brown
        case "FDP": return ThemeColor.yellow
        case "BSW": return ThemeColor.pink
        case "Bundesregierung": return ThemeColor.fg
        default: return ThemeColor.gray
        }
    }

    static func slug(_ party: String) -> String {
        switch party {
        case "CDU/CSU": return "cdu-csu"
        case "SPD": return "spd"
        case "AfD": return "afd"
        case "B90/Grüne": return "gruene"
        case "Die Linke": return "linke"
        case "fraktionslos": return "fraktionslos"
        case "Bundesregierung": return "bundesregierung"
        default: return party
        }
    }

    static let logoSlugs: Set<String> = ["cdu-csu", "spd", "afd", "gruene", "linke"]

    static func hasLogo(_ party: String) -> Bool {
        logoSlugs.contains(slug(party))
    }

    static let governing = ["CDU/CSU", "SPD"]

    static func isGoverning(_ party: String) -> Bool {
        governing.contains(party)
    }

    static func hasPartyLine(_ party: String) -> Bool {
        !party.isEmpty && party != "fraktionslos" && party != "Bundesregierung"
            && party != "Petitionsausschuss" && party != "Wahlprüfungsausschuss"
    }

    static func label(_ party: String) -> String {
        switch party {
        case "B90/Grüne": return "Grüne"
        case "Die Linke": return "Linke"
        case "": return "Unbekannt"
        default: return party
        }
    }
}
