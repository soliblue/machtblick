import Foundation

enum Bundeslaender {
    static let all: Set<String> = [
        "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen",
        "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland",
        "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
    ]

    static func isLaenderInitiative(_ fraktion: String?) -> Bool {
        guard let fraktion, !fraktion.isEmpty else { return false }
        let parts = fraktion.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        return !parts.isEmpty && parts.allSatisfy { all.contains($0) }
    }
}
