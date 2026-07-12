import SwiftUI

struct SettingsView: View {
    let cache: ApiCache
    @Binding var appLanguage: AppLanguage
    @State private var scroll = ScrollPositionModel()

    var body: some View {
        GeometryReader { proxy in
            ScrollView {
                VStack(spacing: 0) {
                    HStack(spacing: ThemeTokens.Spacing.m) {
                        Image(systemName: "globe")
                            .font(.system(size: ThemeTokens.Icon.m))
                            .frame(width: ThemeTokens.Icon.l)
                            .accessibilityHidden(true)
                        Text(Copy.languageSection)
                            .font(.system(size: ThemeTokens.Text.l))
                            .accessibilityHidden(true)
                        Spacer()
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
                        .pickerStyle(.menu)
                        .tint(ThemeColor.fg)
                        .accessibilityLabel(Copy.languageSection)
                    }
                    .foregroundStyle(ThemeColor.fg)
                    .padding(.vertical, ThemeTokens.Spacing.l)
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
                    Spacer(minLength: ThemeTokens.Spacing.xl)
                    HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: ThemeTokens.Icon.m))
                            .frame(width: ThemeTokens.Icon.l)
                            .accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                            Text(Copy.lastRefresh)
                                .font(.system(size: ThemeTokens.Text.m))
                            Text(
                                cache.fetchedAt(appLanguage.resolved.dataPath("/api/votes.json"))
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
                        item: URL(string: "https://testflight.apple.com/join/r7RVrgtr")!,
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
            .onScrollGeometryChange(for: Double.self) { geometry in
                geometry.contentOffset.y
            } action: { _, value in
                scroll.y = value
            }
        }
        .background(ThemeColor.background)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                BrandWordmark(scroll: scroll)
            }
            .sharedBackgroundVisibility(.hidden)
        }
    }
}
