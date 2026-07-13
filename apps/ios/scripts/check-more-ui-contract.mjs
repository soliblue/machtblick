import { readdirSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const read = (path) => readFileSync(resolve(root, path), "utf8")
const tabs = read("apps/ios/src/RootTabView.swift")
const app = read("apps/ios/src/MachtblickApp.swift")
const settings = read("apps/ios/src/Features/Settings/UI/SettingsView.swift")
const footer = read("apps/bundestag/src/views/nav/Footer.tsx")
const webCopy = read("apps/bundestag/src/lib/copy/de.ts") + read("apps/bundestag/src/lib/copy/en.ts")
const strings = read("apps/ios/src/Localizable.xcstrings")
const pickerRow = read("apps/ios/src/Features/Settings/UI/MorePickerRow.swift")
const theme = read("apps/ios/src/Core/Theme/AppTheme.swift")
const colors = read("apps/ios/src/Core/Theme/ThemeColor.swift")
const partySurface = read("apps/ios/src/Core/UI/PartySurface.swift")
const stamp = read("apps/ios/src/Core/UI/StampView.swift")
const voteHemicycle = read("apps/ios/src/Features/Votes/UI/VoteHemicycleView.swift")
const conversationBubble = read("apps/ios/src/Features/Speeches/UI/ConversationBubble.swift")
const partySummaryBubble = read("apps/ios/src/Features/Speeches/UI/PartySummaryBubble.swift")
const chatInboxRow = read("apps/ios/src/Features/Members/UI/ChatInboxRow.swift")
const semanticColors = read("apps/ios/src/Core/Theme/SemanticColors.swift")
const launchBackground = read("apps/ios/src/Assets.xcassets/LaunchBackground.colorset/Contents.json")
const accentColor = read("apps/ios/src/Assets.xcassets/AccentColor.colorset/Contents.json")
const themeUITest = read("apps/ios/UITests/ThemePreferenceUITests.swift")
const project = read("apps/ios/iOS.xcodeproj/project.pbxproj")
const scheme = read("apps/ios/iOS.xcodeproj/xcshareddata/xcschemes/Machtblick.xcscheme")
const failures = []
const requireFragments = (source, path, fragments) => {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${path} is missing ${fragment}`)
  }
}

requireFragments(tabs, "RootTabView.swift", [
  'Image(systemName: "checkmark.seal")',
  'Image(systemName: "person.2")',
  'Image(systemName: "chart.pie")',
  'Image(systemName: "slider.horizontal.3")',
  ".accessibilityLabel(Copy.votesTab)",
  ".accessibilityLabel(Copy.membersTab)",
  ".accessibilityLabel(Copy.partiesTab)",
  ".accessibilityLabel(Copy.moreTab)",
])
requireFragments(settings, "SettingsView.swift", [
  "BrandWordmark(scroll: scroll)",
  "Copy.themeSection",
  "optionName: Copy.themeSelectionName",
  "AboutDataView()",
  "ImprintView()",
  "PrivacyView()",
  "Copy.sourceCode",
  'Link(destination: URL(string: "https://github.com/soliblue/machtblick")!)',
  'systemImage: "building.columns"',
  'systemImage: "doc.text"',
  'systemImage: "hand.raised"',
  'systemImage: "chevron.left.forwardslash.chevron.right"',
  'systemImage: "circle.lefthalf.filled"',
  'Image(systemName: "clock.arrow.circlepath")',
  "ShareLink(",
  'Image(systemName: "square.and.arrow.up")',
  'identifier: "language-picker"',
  'identifier: "appearance-picker"',
  "AppTheme.persisted = $0",
  "appTheme = $0",
])
requireFragments(footer, "Footer.tsx", [
  'href="https://github.com/soliblue/machtblick"',
  'target="_blank"',
  'rel="noreferrer"',
  "{t.sourceCode}",
])
requireFragments(webCopy, "lib/copy", [
  "aboutData: 'Daten'",
  "sourceCode: 'Code'",
  "aboutData: 'Data'",
])
requireFragments(strings, "Localizable.xcstrings", [
  '"copy.aboutData": {"localizations":{"de":{"stringUnit":{"state":"translated","value":"Daten"}},"en":{"stringUnit":{"state":"translated","value":"Data"}}}}',
  '"copy.sourceCode": {"localizations":{"de":{"stringUnit":{"state":"translated","value":"Code"}},"en":{"stringUnit":{"state":"translated","value":"Code"}}}}',
])
requireFragments(pickerRow, "MorePickerRow.swift", [
  "Menu {",
  "ForEach(options, id: \\.self)",
  "Button {",
  'Label(optionName(option), systemImage: "checkmark")',
  ".buttonStyle(.plain)",
  ".frame(maxWidth: .infinity)",
  ".contentShape(Rectangle())",
  ".accessibilityLabel(title)",
  ".accessibilityValue(value)",
])
requireFragments(app, "MachtblickApp.swift", [
  "@State private var appTheme: AppTheme",
  "let theme = screenshot == nil ? AppTheme.persisted : .light",
  "_appTheme = State(initialValue: theme)",
  "appTheme: $appTheme",
  ".preferredColorScheme(appTheme.colorScheme)",
])
requireFragments(theme, "AppTheme.swift", [
  "case system",
  "case light",
  "case dark",
  'string(forKey: "appTheme")',
  "?? .light",
  "var colorScheme: ColorScheme?",
  "case .system: return nil",
])
requireFragments(colors, "ThemeColor.swift", [
  "adaptive(light: 0xFFFFFF, dark: 0x000000)",
  "adaptive(light: 0xF7F7F7, dark: 0x1C1C1E)",
  "adaptive(light: 0xEDEDED, dark: 0x2C2C2E)",
  "adaptive(light: 0x0A0A0A, dark: 0xFFFFFF)",
  "traits.userInterfaceStyle == .dark",
  "static let onSuccess",
  "static let onDanger",
  "static let onYellow",
])
requireFragments(partySurface, "PartySurface.swift", [
  "@Environment(\\.colorScheme)",
  "ThemeColor.surface",
  "ThemeTokens.Opacity.s",
  "ThemeTokens.Opacity.m",
  "ThemeTokens.Opacity.l",
  "ThemeTokens.Stroke.s",
  "ThemeTokens.Stroke.l",
])
requireFragments(stamp, "StampView.swift", [
  "@Environment(\\.colorScheme)",
  ".blendMode(colorScheme == .dark ? .normal : .multiply)",
])
requireFragments(voteHemicycle, "VoteHemicycleView.swift", [
  "@Environment(\\.colorScheme)",
  "colorScheme == .dark ? ThemeTokens.Opacity.l : ThemeTokens.Opacity.m",
  "colorScheme == .dark ? ThemeTokens.Opacity.m : ThemeTokens.Opacity.s",
])
for (const [source, path] of [
  [conversationBubble, "ConversationBubble.swift"],
  [partySummaryBubble, "PartySummaryBubble.swift"],
  [chatInboxRow, "ChatInboxRow.swift"],
]) {
  requireFragments(source, path, ["PartySurface("])
}
requireFragments(semanticColors, "SemanticColors.swift", [
  "case .ja: return ThemeColor.onSuccess",
  "case .nein: return ThemeColor.onDanger",
  "case .enthalten: return ThemeColor.onYellow",
])
requireFragments(launchBackground, "LaunchBackground.colorset/Contents.json", [
  '"appearance" : "luminosity"',
  '"value" : "dark"',
])
requireFragments(accentColor, "AccentColor.colorset/Contents.json", [
  '"appearance" : "luminosity"',
  '"value" : "dark"',
])
requireFragments(themeUITest, "ThemePreferenceUITests.swift", [
  "testThemeSwitchingAndPersistence()",
  'selection: "Light", resolved: "light", screenshot: "default-light-on-dark-device"',
  'selection: "System", resolved: "dark"',
  'option: "Light", resolved: "light"',
  'option: "Dark", resolved: "dark"',
  'app.terminate()',
])
requireFragments(project, "project.pbxproj", [
  "MachtblickUITests.xctest",
  'productType = "com.apple.product-type.bundle.ui-testing"',
  "TEST_TARGET_NAME = Machtblick",
])
requireFragments(scheme, "Machtblick.xcscheme", [
  'BlueprintName = "MachtblickUITests"',
  'buildForArchiving = "NO"',
])

const rowOrder = [
  "Copy.languageSection",
  "Copy.themeSection",
  "AboutDataView()",
  "ImprintView()",
  "PrivacyView()",
  "Copy.sourceCode",
  "Copy.lastRefresh",
  "ShareLink(",
].map((fragment) => settings.indexOf(fragment))
if (rowOrder.some((index, position) => index < 0 || (position > 0 && index <= rowOrder[position - 1]))) {
  failures.push("More rows must follow the preference, information, freshness, and share order.")
}

if (/\bLabel\(Copy\./.test(tabs)) failures.push("Root tabs must remain icon-only.")
if (settings.includes("InAppBrowser")) failures.push("More destinations must remain native.")
if (settings.includes("Spacer(minLength:")) failures.push("More rows must not be separated by a flexible gap.")
const swiftSources = []
const collectSwiftSources = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) collectSwiftSources(path)
    else if (path.endsWith(".swift")) swiftSources.push(readFileSync(path, "utf8"))
  }
}
collectSwiftSources(resolve(root, "apps/ios/src"))
if (/\.preferredColorScheme\(\.(?:light|dark)\)/.test(swiftSources.join("\n"))) {
  failures.push("The app must not force light or dark appearance outside the user preference.")
}
if (project.includes("UIUserInterfaceStyle")) failures.push("The project must not force one interface style.")
if (failures.length) throw new Error(failures.join("\n"))

console.log("Icon-only tabs and the compact native More layout match their release contract.")
