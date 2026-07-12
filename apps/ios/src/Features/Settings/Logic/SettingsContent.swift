import SwiftUI

struct SettingsContent {
    let title: String
    let sections: [SettingsContentSection]
}

struct SettingsContentSection {
    let heading: String?
    let blocks: [SettingsContentBlock]
}

enum SettingsContentBlock {
    case paragraph(String)
    case linkedParagraph(SettingsLinkedParagraph)
    case subsection(String)
    case sources([SettingsContentSource], note: String?)
    case contacts([SettingsContentContact])
    case footnote(String)
}

struct SettingsLinkedParagraph {
    let text: String
    let linkLabel: String
    let url: URL

    var attributed: AttributedString {
        let parts = text.components(separatedBy: linkLabel)
        precondition(parts.count == 2)
        var value = AttributedString(parts[0])
        var link = AttributedString(linkLabel)
        link.link = url
        link.underlineStyle = .single
        value += link
        value += AttributedString(parts[1])
        return value
    }
}

struct SettingsContentSource: Identifiable {
    let name: String?
    let url: URL
    let display: String
    let description: String

    var id: String { url.absoluteString }
}

struct SettingsContentContact: Identifiable {
    let label: String
    let email: String

    var id: String { email }
    var url: URL { URL(string: "mailto:\(email)")! }
}
