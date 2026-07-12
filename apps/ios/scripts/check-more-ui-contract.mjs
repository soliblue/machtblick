import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const read = (path) => readFileSync(resolve(root, path), "utf8")
const tabs = read("apps/ios/src/RootTabView.swift")
const settings = read("apps/ios/src/Features/Settings/UI/SettingsView.swift")
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
  ".pickerStyle(.menu)",
  "AboutDataView()",
  "ImprintView()",
  "PrivacyView()",
  'systemImage: "building.columns"',
  'systemImage: "doc.text"',
  'systemImage: "hand.raised"',
  'Image(systemName: "clock.arrow.circlepath")',
  "ShareLink(",
  'Image(systemName: "square.and.arrow.up")',
])

if (/\bLabel\(Copy\./.test(tabs)) failures.push("Root tabs must remain icon-only.")
if (settings.includes("InAppBrowser")) failures.push("More destinations must remain native.")
if (failures.length) throw new Error(failures.join("\n"))

console.log("Icon-only tabs and the compact native More layout match their release contract.")
