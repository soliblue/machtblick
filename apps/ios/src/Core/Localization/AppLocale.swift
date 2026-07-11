import Foundation

enum AppLocale: String, Sendable {
    case de
    case en

    static var current: AppLocale {
        AppLanguage.persisted.resolved
    }

    var locale: Locale {
        Locale(identifier: self == .de ? "de_DE" : "en_GB")
    }

    func localized(_ key: String, in bundle: Bundle = .main) -> String {
        (bundle.path(forResource: rawValue, ofType: "lproj")
            .flatMap(Bundle.init(path:)) ?? bundle)
            .localizedString(forKey: key, value: key, table: nil)
    }

    func dataPath(_ path: String) -> String {
        localizedPath(path)
    }

    func localizedPath(_ path: String) -> String {
        self == .de ? path : path.hasPrefix("/") ? "/en\(path)" : "/en/\(path)"
    }
}
