import SwiftUI

struct SettingsReadingPage: View {
    let content: SettingsContent
    let backLabel: String
    @Environment(\.dismiss) private var dismiss
    @State private var browser: BrowserDestination?
    @State private var showImprint = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text(content.title)
                    .font(.display(ThemeTokens.Text.xxl))
                    .accessibilityAddTraits(.isHeader)
                ForEach(Array(content.sections.enumerated()), id: \.offset) { _, section in
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                        if let heading = section.heading {
                            Text(heading)
                                .kicker()
                                .accessibilityAddTraits(.isHeader)
                        }
                        ForEach(Array(section.blocks.enumerated()), id: \.offset) { _, block in
                            blockView(block)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, ThemeTokens.Spacing.xl)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(ThemeTokens.Spacing.l)
        }
        .background(ThemeColor.background)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden()
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button { dismiss() } label: {
                    Label(backLabel, systemImage: "chevron.left")
                        .font(.system(size: ThemeTokens.Text.l))
                }
                .accessibilityLabel(backLabel)
            }
        }
        .tint(ThemeColor.fg)
        .environment(\.openURL, OpenURLAction { url in
            let isMail = url.scheme == "mailto"
            let isImprint = url.host == "machtblick.de" && url.path.hasSuffix("/imprint/")
            if isImprint { showImprint = true }
            if !isMail && !isImprint { browser = BrowserDestination(url: url) }
            return isMail ? .systemAction : .handled
        })
        .navigationDestination(isPresented: $showImprint) {
            ImprintView(backLabel: content.title)
        }
        .sheet(item: $browser) { destination in
            InAppBrowser(url: destination.url)
                .ignoresSafeArea()
        }
    }

    @ViewBuilder private func blockView(_ block: SettingsContentBlock) -> some View {
        switch block {
        case .paragraph(let text):
            Text(text)
                .font(.system(size: ThemeTokens.Text.m))
        case .linkedParagraph(let paragraph):
            Text(paragraph.attributed)
                .font(.system(size: ThemeTokens.Text.m))
        case .subsection(let heading):
            Text(heading)
                .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                .padding(.top, ThemeTokens.Spacing.xs)
                .accessibilityAddTraits(.isHeader)
        case .sources(let sources, let note):
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                ForEach(sources) { source in
                    Link(destination: source.url) {
                        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                            if let name = source.name {
                                Text(name)
                                    .font(.system(size: ThemeTokens.Text.m))
                            }
                            Text(source.display)
                                .font(.system(size: ThemeTokens.Text.m))
                                .foregroundStyle(ThemeColor.secondary)
                                .underline()
                            Text(source.description)
                                .font(.system(size: ThemeTokens.Text.s))
                                .foregroundStyle(ThemeColor.secondary)
                        }
                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
                if let note {
                    Text(note)
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.fg.opacity(ThemeTokens.Opacity.m))
                        .padding(.top, ThemeTokens.Spacing.xs)
                }
            }
            .padding(.leading, ThemeTokens.Spacing.m)
        case .contacts(let contacts):
            VStack(alignment: .leading, spacing: 0) {
                ForEach(contacts) { contact in
                    Link(destination: contact.url) {
                        HStack(alignment: .firstTextBaseline, spacing: ThemeTokens.Spacing.l) {
                            Text(contact.label)
                                .foregroundStyle(ThemeColor.secondary)
                            Spacer(minLength: ThemeTokens.Spacing.l)
                            Text(contact.email)
                                .multilineTextAlignment(.trailing)
                                .underline()
                        }
                        .font(.system(size: ThemeTokens.Text.m))
                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
        case .footnote(let text):
            Text(text)
                .font(.system(size: ThemeTokens.Text.s))
                .foregroundStyle(ThemeColor.secondary)
                .padding(.top, ThemeTokens.Spacing.m)
        }
    }
}
