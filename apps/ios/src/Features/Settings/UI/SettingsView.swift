import SwiftUI
import UIKit

struct SettingsView: View {
    let cache: ApiCache
    @Binding var appLanguage: AppLanguage
    @State private var browser: BrowserDestination?

    var body: some View {
        List {
            MoreHeaderView()
                .listRowBackground(ThemeColor.background)
                .listRowSeparator(.hidden)
            Section(Copy.languageSection) {
                Picker(
                    Copy.languageSection,
                    selection: Binding(
                        get: { appLanguage },
                        set: {
                            AppLanguage.persisted = $0
                            appLanguage = $0
                        })
                ) {
                    ForEach(AppLanguage.allCases) { language in
                        Text(Copy.languageSelectionName(language)).tag(language)
                    }
                }
                .pickerStyle(.segmented)
                if appLanguage == .system {
                    Text(Copy.systemLanguageHint(appLanguage.resolved))
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                }
            }
            Section(Copy.projectSection) {
                browserRow(Copy.website, systemImage: "globe", path: "/")
                browserRow(Copy.aboutData, systemImage: "externaldrive", path: "/methodology/")
                Link(
                    destination: MailDraft(
                        recipient: "hello@machtblick.de", subject: Copy.questionsSubject, body: nil
                    ).url
                ) {
                    MoreRowLabel(title: Copy.questions, systemImage: "envelope")
                }
                Link(
                    destination: MailDraft(
                        recipient: "feedback@machtblick.de", subject: Copy.feedbackSubject,
                        body: Copy.feedbackBody(
                            version: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
                                ?? Copy.unknown,
                            build: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String
                                ?? Copy.unknown,
                            selection: appLanguage,
                            resolved: appLanguage.resolved,
                            iOSVersion: UIDevice.current.systemVersion)
                    ).url
                ) {
                    MoreRowLabel(title: Copy.feedback, systemImage: "bubble.left")
                }
                Link(
                    destination: MailDraft(
                        recipient: "mitmachen@machtblick.de", subject: Copy.contributeSubject, body: nil
                    ).url
                ) {
                    MoreRowLabel(title: Copy.contribute, systemImage: "person.3")
                }
                ShareLink(
                    item: URL(string: "https://testflight.apple.com/join/r7RVrgtr")!,
                    subject: Text(Copy.shareMachtblick), message: Text(Copy.shareMessage)
                ) {
                    MoreRowLabel(title: Copy.shareMachtblick, systemImage: "square.and.arrow.up")
                }
            }
            Section(Copy.legalSection) {
                browserRow(Copy.imprint, systemImage: "doc.text", path: "/imprint/")
                browserRow(Copy.privacy, systemImage: "hand.raised", path: "/privacy/")
            }
            Section(Copy.refreshSection) {
                HStack {
                    Text(Copy.lastRefresh)
                    Spacer()
                    Text(lastRefresh)
                        .foregroundStyle(ThemeColor.secondary)
                }
            }
            Section {
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                    Text(Copy.privacyStatement)
                    Text(
                        Copy.versionLabel(
                            version: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString")
                                as? String ?? Copy.unknown,
                            build: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String
                                ?? Copy.unknown))
                    Text(Copy.fontLicense)
                }
                .font(.system(size: ThemeTokens.Text.s))
                .foregroundStyle(ThemeColor.secondary)
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(ThemeColor.background)
        .navigationTitle(Copy.moreTab)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $browser) { destination in
            InAppBrowser(url: destination.url)
                .ignoresSafeArea()
        }
    }

    private func browserRow(_ title: String, systemImage: String, path: String) -> some View {
        Button {
            browser = BrowserDestination(url: HTTPClient.page(path))
        } label: {
            MoreRowLabel(title: title, systemImage: systemImage)
        }
        .buttonStyle(.plain)
    }

    private var lastRefresh: String {
        cache.fetchedAt(appLanguage.resolved.dataPath("/api/votes.json")).map(Formatters.dateTime) ?? Copy.never
    }
}
