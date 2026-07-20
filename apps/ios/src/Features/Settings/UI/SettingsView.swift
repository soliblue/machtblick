import SwiftUI

struct SettingsView: View {
    let cache: ApiCache
    @Binding var appLanguage: AppLanguage
    @Binding var appTheme: AppTheme
    @Environment(\.colorScheme) private var colorScheme
    @State private var scroll = ScrollPositionModel()

    var body: some View {
        GeometryReader { proxy in
            ScrollView {
                VStack(spacing: 0) {
                    MorePickerRow(
                        title: Copy.languageSection,
                        systemImage: "globe",
                        value: Copy.languageSelectionName(appLanguage),
                        identifier: "language-picker",
                        selection: Binding(
                            get: { appLanguage },
                            set: {
                                AppLanguage.persisted = $0
                                appLanguage = $0
                            }),
                        options: AppLanguage.allCases,
                        optionName: Copy.languageSelectionName)
                    MoreDivider()
                    MorePickerRow(
                        title: Copy.themeSection,
                        systemImage: "circle.lefthalf.filled",
                        value: Copy.themeSelectionName(appTheme),
                        identifier: "appearance-picker",
                        selection: Binding(
                            get: { appTheme },
                            set: {
                                AppTheme.persisted = $0
                                appTheme = $0
                            }),
                        options: AppTheme.allCases,
                        optionName: Copy.themeSelectionName)
                    MoreDivider()
                    NavigationLink {
                        AboutDataView()
                    } label: {
                        MoreRowLabel(title: Copy.aboutData, systemImage: "building.columns")
                    }
                    MoreDivider()
                    NavigationLink {
                        ImprintView()
                    } label: {
                        MoreRowLabel(title: Copy.imprint, systemImage: "doc.text")
                    }
                    MoreDivider()
                    NavigationLink {
                        PrivacyView()
                    } label: {
                        MoreRowLabel(title: Copy.privacy, systemImage: "hand.raised")
                    }
                    MoreDivider()
                    Link(destination: URL(string: "https://github.com/soliblue/machtblick")!) {
                        MoreRowLabel(
                            title: Copy.sourceCode,
                            systemImage: "chevron.left.forwardslash.chevron.right"
                        )
                    }
                    MoreDivider()
                    HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: ThemeTokens.Icon.m))
                            .frame(width: ThemeTokens.Icon.l)
                            .accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                            Text(Copy.lastRefresh)
                                .font(.system(size: ThemeTokens.Text.m))
                            Text(
                                cache.fetchedAt(appLanguage.resolved.dataPath(Endpoints.votes))
                                    .map(Formatters.dateTime) ?? Copy.never
                            )
                            .font(.system(size: ThemeTokens.Text.m))
                            .foregroundStyle(ThemeColor.secondary)
                        }
                        Spacer()
                    }
                    .padding(.vertical, ThemeTokens.Spacing.l)
                    .accessibilityElement(children: .combine)
                    MoreDivider()
                    ShareLink(
                        item: URL(string: "https://apps.apple.com/us/app/machtblick/id6787755187")!,
                        subject: Text(Copy.shareMachtblick), message: Text(Copy.shareMessage)
                    ) {
                        HStack(spacing: ThemeTokens.Spacing.m) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: ThemeTokens.Icon.m))
                                .frame(width: ThemeTokens.Icon.l)
                            Text(Copy.shareMachtblick)
                                .font(.system(size: ThemeTokens.Text.l))
                            Spacer()
                        }
                        .foregroundStyle(ThemeColor.fg)
                        .contentShape(Rectangle())
                        .padding(.vertical, ThemeTokens.Spacing.l)
                    }
                    .buttonStyle(.plain)
                    Text(
                        Copy.versionLabel(
                            version: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString")
                                as? String ?? Copy.unknown,
                            build: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String
                                ?? Copy.unknown)
                    )
                        .kicker()
                        .foregroundStyle(ThemeColor.secondary)
                        .padding(.top, ThemeTokens.Spacing.m)
                }
                .frame(minHeight: proxy.size.height, alignment: .top)
                .padding(.horizontal, ThemeTokens.Spacing.l)
                .padding(.bottom, ThemeTokens.Spacing.l)
            }
            .scrollPosition(scroll.binding)
            .onScrollGeometryChange(for: Double.self) { geometry in
                geometry.contentOffset.y
            } action: { _, value in
                scroll.y = value
            }
        }
        .background(ThemeColor.background)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .overlay(alignment: .topLeading) {
            #if DEBUG
            Text(colorScheme == .dark ? "dark" : "light")
                .font(.system(size: 1))
                .foregroundStyle(ThemeColor.background)
                .frame(width: 1, height: 1)
                .accessibilityIdentifier("resolved-theme")
            #endif
        }
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                BrandWordmark(scroll: scroll)
            }
            .sharedBackgroundVisibility(.hidden)
        }
    }
}
