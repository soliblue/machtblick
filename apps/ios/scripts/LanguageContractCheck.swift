import Foundation

@main
struct LanguageContractCheck {
    static func main() {
        precondition(AppLanguage.system.resolve(preferredLanguages: ["de-DE", "en-GB"]) == .de)
        precondition(AppLanguage.system.resolve(preferredLanguages: ["en-GB", "de-DE"]) == .en)
        precondition(AppLanguage.system.resolve(preferredLanguages: []) == .en)
        precondition(AppLanguage.de.resolve(preferredLanguages: ["en-GB"]) == .de)
        precondition(AppLanguage.en.resolve(preferredLanguages: ["de-DE"]) == .en)
        precondition(AppLocale.de.dataPath("/api/votes.json") == "/api/votes.json")
        precondition(AppLocale.en.dataPath("/api/votes.json") == "/en/api/votes.json")
        precondition(AppLocale.en.localizedPath("privacy/") == "/en/privacy/")
        let original = AppLanguage.persisted
        AppLanguage.persisted = .en
        precondition(AppLanguage.persisted == .en)
        precondition(Formatters.longDate("2026-07-11").contains("July"))
        precondition(Formatters.percent(0.5).contains("50"))
        precondition(Formatters.euro(100).contains("€"))
        AppLanguage.persisted = .de
        precondition(AppLanguage.persisted == .de)
        precondition(Formatters.longDate("2026-07-11").contains("Juli"))
        precondition(Formatters.percent(0.5).contains("50"))
        precondition(Formatters.euro(100).contains("€"))
        AppLanguage.persisted = original
        print("System resolution, overrides, persistence, localized paths, and formatters pass.")
    }
}
