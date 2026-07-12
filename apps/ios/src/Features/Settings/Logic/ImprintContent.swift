import Foundation

enum ImprintContent {
    static func content(_ locale: AppLocale = .current) -> SettingsContent {
        locale == .de ? german : english
    }

    private static let opendata = URL(string: "https://www.bundestag.de/services/opendata")!
    private static let dserver = URL(string: "https://dserver.bundestag.de/")!
    private static let parteienfinanzierung = URL(string: "https://www.bundestag.de/parlament/praesidium/parteienfinanzierung")!
    private static let dipSearch = URL(string: "https://search.dip.bundestag.de/")!
    private static let abgeordnetenwatch = URL(string: "https://www.abgeordnetenwatch.de/")!
    private static let wikidata = URL(string: "https://query.wikidata.org/")!
    private static let commons = URL(string: "https://commons.wikimedia.org/")!
    private static let soliBlue = URL(string: "https://soli.blue")!

    private static let german = SettingsContent(
        title: "Impressum",
        sections: [
            SettingsContentSection(
                heading: "Was ist Machtblick",
                blocks: [
                    .paragraph(
                        "Machtblick macht die Arbeit des Bundestages und der Regierung zugänglicher. Öffentliche Quellen werden mit Hilfe von KI in eine Oberfläche übersetzt, die für die Allgemeinheit nutzbar ist. Keine Kommentare, keine politische Position, kein Aktivismus."
                    )
                ]),
            SettingsContentSection(
                heading: "Datenquellen",
                blocks: [
                    .subsection("Deutscher Bundestag"),
                    .sources(
                        [
                            SettingsContentSource(
                                name: "Stammdaten",
                                url: opendata,
                                display: "bundestag.de",
                                description: "Stammdaten der Abgeordneten"),
                            SettingsContentSource(
                                name: "Plenarprotokolle",
                                url: dserver,
                                display: "dserver.bundestag.de",
                                description: "Reden und Protokolle der Plenarsitzungen"),
                            SettingsContentSource(
                                name: "Parlamentaria",
                                url: parteienfinanzierung,
                                display: "bundestag.de",
                                description: "Parteispenden über 50.000 Euro"),
                            SettingsContentSource(
                                name: "DIP",
                                url: dipSearch,
                                display: "search.dip.bundestag.de",
                                description: "Anträge und Drucksachen"),
                        ],
                        note: "Quellen ohne explizite Lizenzangabe sind öffentlich zugängliche Daten des Deutschen Bundestages."),
                    .subsection("abgeordnetenwatch"),
                    .sources(
                        [
                            SettingsContentSource(
                                name: nil,
                                url: abgeordnetenwatch,
                                display: "abgeordnetenwatch.de",
                                description: "Profile, Fraktionswechsel, Porträtverweise")
                        ],
                        note: nil),
                    .subsection("Bilder"),
                    .sources(
                        [
                            SettingsContentSource(
                                name: "Wikidata",
                                url: wikidata,
                                display: "query.wikidata.org",
                                description: "Porträtverweise (P18), CC0"),
                            SettingsContentSource(
                                name: "Wikimedia Commons",
                                url: commons,
                                display: "commons.wikimedia.org",
                                description: "Porträtdateien, Lizenzen je Datei mitgespeichert"),
                        ],
                        note: nil),
                ]),
            SettingsContentSection(
                heading: "Grundsätze",
                blocks: [
                    .paragraph(
                        "Keine Kommentare, keine Voreingenommenheit gegenüber irgendeiner Gruppe, kein Aktivismus. Nur ein leichterer Zugang zu Informationen aus Quellen, die von großartigen Menschen öffentlich gemacht wurden."
                    )
                ]),
            SettingsContentSection(
                heading: "Kontakt",
                blocks: [
                    .contacts([
                        SettingsContentContact(label: "Fragen", email: "hello@machtblick.de"),
                        SettingsContentContact(label: "Feedback", email: "feedback@machtblick.de"),
                        SettingsContentContact(label: "Mitmachen", email: "mitmachen@machtblick.de"),
                    ])
                ]),
            SettingsContentSection(
                heading: "Zur Person",
                blocks: [
                    .linkedParagraph(
                        SettingsLinkedParagraph(
                            text: "Machtblick ist ein Projekt von Ahmed Soliman.",
                            linkLabel: "Ahmed Soliman",
                            url: soliBlue))
                ]),
        ])

    private static let english = SettingsContent(
        title: "Imprint",
        sections: [
            SettingsContentSection(
                heading: "What Machtblick is",
                blocks: [
                    .paragraph(
                        "Machtblick makes the work of the Bundestag and the Federal Government easier to access. Public sources are translated with the help of AI into an interface the public can actually use. No commentary, no political position, no activism."
                    )
                ]),
            SettingsContentSection(
                heading: "Data sources",
                blocks: [
                    .subsection("German Bundestag"),
                    .sources(
                        [
                            SettingsContentSource(
                                name: "Master data",
                                url: opendata,
                                display: "bundestag.de",
                                description: "Member master data"),
                            SettingsContentSource(
                                name: "Plenary records",
                                url: dserver,
                                display: "dserver.bundestag.de",
                                description: "Speeches and plenary records"),
                            SettingsContentSource(
                                name: "Parlamentaria",
                                url: parteienfinanzierung,
                                display: "bundestag.de",
                                description: "Party donations above 50,000 euros"),
                            SettingsContentSource(
                                name: "DIP",
                                url: dipSearch,
                                display: "search.dip.bundestag.de",
                                description: "Motions and parliamentary papers"),
                        ],
                        note: "Sources without an explicit license notice are publicly available data from the German Bundestag."),
                    .subsection("abgeordnetenwatch"),
                    .sources(
                        [
                            SettingsContentSource(
                                name: nil,
                                url: abgeordnetenwatch,
                                display: "abgeordnetenwatch.de",
                                description: "Profiles, party changes, portrait references")
                        ],
                        note: nil),
                    .subsection("Images"),
                    .sources(
                        [
                            SettingsContentSource(
                                name: "Wikidata",
                                url: wikidata,
                                display: "query.wikidata.org",
                                description: "Portrait references (P18), CC0"),
                            SettingsContentSource(
                                name: "Wikimedia Commons",
                                url: commons,
                                display: "commons.wikimedia.org",
                                description: "Portrait files, licenses stored per file"),
                        ],
                        note: nil),
                ]),
            SettingsContentSection(
                heading: "Principles",
                blocks: [
                    .paragraph(
                        "No commentary, no bias against any group, no activism. Just easier access to information from sources made public by people doing valuable work."
                    )
                ]),
            SettingsContentSection(
                heading: "Contact",
                blocks: [
                    .contacts([
                        SettingsContentContact(label: "Questions", email: "hello@machtblick.de"),
                        SettingsContentContact(label: "Feedback", email: "feedback@machtblick.de"),
                        SettingsContentContact(label: "Contribute", email: "mitmachen@machtblick.de"),
                    ])
                ]),
            SettingsContentSection(
                heading: "About the operator",
                blocks: [
                    .linkedParagraph(
                        SettingsLinkedParagraph(
                            text: "Machtblick is a project by Ahmed Soliman.",
                            linkLabel: "Ahmed Soliman",
                            url: soliBlue))
                ]),
        ])
}
