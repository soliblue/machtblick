import Foundation

enum AboutDataContent {
    static func content(_ locale: AppLocale = .current) -> SettingsContent {
        locale == .de ? german : english
    }

    private static let opendata = URL(string: "https://www.bundestag.de/services/opendata")!
    private static let dip = URL(string: "https://dip.bundestag.de/")!
    private static let commons = URL(string: "https://commons.wikimedia.org/")!
    private static let abgeordnetenwatch = URL(string: "https://www.abgeordnetenwatch.de/")!

    private static let german = SettingsContent(
        title: "Über die Daten",
        sections: [
            SettingsContentSection(
                heading: "Datenquellen",
                blocks: [
                    .sources(
                        [
                            SettingsContentSource(
                                name: "Bundestag Open Data",
                                url: opendata,
                                display: "bundestag.de",
                                description: "Namentliche Abstimmungen und Stammdaten der Abgeordneten (XML)"),
                            SettingsContentSource(
                                name: "DIP",
                                url: dip,
                                display: "dip.bundestag.de",
                                description: "Metadaten zu Anträgen und Drucksachen über die DIP-API des Bundestages"),
                            SettingsContentSource(
                                name: "Wikimedia Commons",
                                url: commons,
                                display: "commons.wikimedia.org",
                                description: "Porträts der Abgeordneten, CC-Lizenzhinweis direkt am jeweiligen Foto"),
                            SettingsContentSource(
                                name: "abgeordnetenwatch.de",
                                url: abgeordnetenwatch,
                                display: "abgeordnetenwatch.de",
                                description: "Porträtverweise und Profildaten"),
                        ],
                        note: nil)
                ]),
            SettingsContentSection(
                heading: "Aktualisierung",
                blocks: [
                    .paragraph(
                        "Die Daten werden wöchentlich über eine automatisierte Pipeline aktualisiert. Jede Abstimmungs- und Antragsseite verlinkt das offizielle Quelldokument des Bundestages (Original-Drucksache als PDF)."
                    )
                ]),
            SettingsContentSection(
                heading: "KI-Hinweis",
                blocks: [
                    .paragraph(
                        "Zusammenfassungen und vereinfachte Titel zu Abstimmungen und Anträgen basieren auf den offiziellen Dokumenten, wurden KI-generiert und sprachlich vereinfacht. Sie können Fehler enthalten. Maßgeblich ist immer die verlinkte Original-Drucksache."
                    )
                ]),
            SettingsContentSection(
                heading: "Betreiber",
                blocks: [
                    .linkedParagraph(
                        SettingsLinkedParagraph(
                            text: "Machtblick ist ein Projekt von Ahmed Soliman. Alle Angaben zum Betreiber stehen im Impressum.",
                            linkLabel: "Impressum",
                            url: URL(string: "https://machtblick.de/imprint/")!))
                ]),
        ])

    private static let english = SettingsContent(
        title: "About the data",
        sections: [
            SettingsContentSection(
                heading: "Data sources",
                blocks: [
                    .sources(
                        [
                            SettingsContentSource(
                                name: "Bundestag Open Data",
                                url: opendata,
                                display: "bundestag.de",
                                description: "Roll call votes and member master data (XML)"),
                            SettingsContentSource(
                                name: "DIP",
                                url: dip,
                                display: "dip.bundestag.de",
                                description: "Motion and parliamentary paper metadata via the DIP API of the Bundestag"),
                            SettingsContentSource(
                                name: "Wikimedia Commons",
                                url: commons,
                                display: "commons.wikimedia.org",
                                description: "Member portraits, CC attribution shown at each photo"),
                            SettingsContentSource(
                                name: "abgeordnetenwatch.de",
                                url: abgeordnetenwatch,
                                display: "abgeordnetenwatch.de",
                                description: "Portrait references and profile data"),
                        ],
                        note: nil)
                ]),
            SettingsContentSection(
                heading: "Updates",
                blocks: [
                    .paragraph(
                        "Data is refreshed weekly through an automated pipeline. Every vote and motion page links the official Bundestag source document (original Drucksache as PDF)."
                    )
                ]),
            SettingsContentSection(
                heading: "AI notice",
                blocks: [
                    .paragraph(
                        "Summaries and simplified titles for votes and motions are based on the official documents. They were generated with AI and simplified linguistically. They may contain errors. The linked original Drucksache is always authoritative."
                    )
                ]),
            SettingsContentSection(
                heading: "Operator",
                blocks: [
                    .linkedParagraph(
                        SettingsLinkedParagraph(
                            text: "Machtblick is a project by Ahmed Soliman. Full operator details are in the Imprint.",
                            linkLabel: "Imprint",
                            url: URL(string: "https://machtblick.de/en/imprint/")!))
                ]),
        ])
}
