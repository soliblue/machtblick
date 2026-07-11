import Foundation

enum AppLanguage: String, CaseIterable, Identifiable, Sendable {
    case system
    case de
    case en

    var id: String { rawValue }

    static var persisted: AppLanguage {
        get {
            AppLanguage(rawValue: UserDefaults.standard.string(forKey: "appLanguage") ?? "")
                ?? .system
        }
        set {
            UserDefaults.standard.set(newValue.rawValue, forKey: "appLanguage")
        }
    }

    var resolved: AppLocale {
        resolve()
    }

    func resolve(preferredLanguages: [String] = Locale.preferredLanguages) -> AppLocale {
        switch self {
        case .system:
            return (preferredLanguages.first ?? AppLocale.en.rawValue)
                .replacingOccurrences(of: "_", with: "-")
                .split(separator: "-", maxSplits: 1)
                .first?
                .lowercased() == AppLocale.de.rawValue ? .de : .en
        case .de:
            return .de
        case .en:
            return .en
        }
    }
}
