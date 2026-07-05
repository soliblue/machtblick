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

    static func label(_ party: String) -> String {
        switch party {
        case "B90/Grüne": return "Grüne"
        case "Die Linke": return "Linke"
        case "": return "Unbekannt"
        default: return party
        }
    }
}
