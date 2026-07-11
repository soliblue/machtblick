import Foundation

@main
struct LocalizedBundleContractCheck {
    static func main() {
        let bundle = Bundle(path: CommandLine.arguments[1])!
        precondition(AppLocale.de.localized("copy.yes", in: bundle) == "Ja")
        precondition(AppLocale.de.localized("copy.loadError", in: bundle) == "Daten konnten nicht geladen werden.")
        precondition(AppLocale.en.localized("copy.yes", in: bundle) == "Yes")
        precondition(AppLocale.en.localized("copy.loadError", in: bundle) == "The data could not be loaded.")
        print("Compiled German and English string bundles resolve through the in-app language contract.")
    }
}
