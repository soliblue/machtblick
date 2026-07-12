import Foundation

enum PrivacyContent {
    static func content(_ locale: AppLocale = .current) -> SettingsContent {
        locale == .de ? german : english
    }

    private static let german = SettingsContent(
        title: "Datenschutz",
        sections: [
            SettingsContentSection(
                heading: nil,
                blocks: [
                    .linkedParagraph(
                        SettingsLinkedParagraph(
                            text: "Diese Seite erhebt keine personenbezogenen Daten. Es gibt keine Analyse-Werkzeuge, keine Cookies, kein Tracking, keine Konten, keine Formulare. Die im Impressum genannten Kontaktadressen werden ausschließlich verwendet, um auf die jeweils gesendete Nachricht zu antworten.",
                            linkLabel: "im Impressum genannten Kontaktadressen",
                            url: URL(string: "https://machtblick.de/imprint/#kontakt")!)),
                    .footnote("Stand: 14. Mai 2026"),
                ])
        ])

    private static let english = SettingsContent(
        title: "Privacy",
        sections: [
            SettingsContentSection(
                heading: nil,
                blocks: [
                    .linkedParagraph(
                        SettingsLinkedParagraph(
                            text: "This site does not collect personal data. There are no analytics tools, no cookies, no tracking, no accounts, and no forms. The contact addresses listed in the imprint are used only to reply to the message sent to them.",
                            linkLabel: "contact addresses listed in the imprint",
                            url: URL(string: "https://machtblick.de/en/imprint/#kontakt")!)),
                    .footnote("Last updated: May 14, 2026"),
                ])
        ])
}
