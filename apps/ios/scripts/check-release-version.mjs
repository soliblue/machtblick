import { readFileSync } from "node:fs"

const read = (path) => readFileSync(path, "utf8")
const config = read("apps/ios/Config/Version.xcconfig")
const version = config.match(/^MARKETING_VERSION = ([0-9]+(?:\.[0-9]+){1,2})$/m)?.[1]
const project = read("apps/ios/iOS.xcodeproj/project.pbxproj")
const fastfile = read("fastlane/Fastfile")
const verifier = read(".github/scripts/asc_testflight.py")

if (!version) throw new Error("Version.xcconfig must define one numeric MARKETING_VERSION.")
if (project.includes("MARKETING_VERSION =")) throw new Error("The Xcode project must inherit MARKETING_VERSION from Version.xcconfig.")
if ((project.match(/baseConfigurationReference = .*Version\.xcconfig/g) ?? []).length !== 4) {
  throw new Error("Every app and UI test configuration must inherit Version.xcconfig.")
}
if (!fastfile.includes('File.expand_path("../apps/ios/Config/Version.xcconfig", __dir__)')) {
  throw new Error("Fastlane must read the centralized marketing version relative to its own directory.")
}
if (!fastfile.includes("app_version: APP_VERSION")) throw new Error("App Store assets must use APP_VERSION.")
if (!verifier.includes('Path("apps/ios/Config/Version.xcconfig")')) {
  throw new Error("TestFlight verification must read the centralized marketing version.")
}

for (const locale of ["de-DE", "en-US"]) {
  const subtitle = read(`fastlane/metadata/${locale}/subtitle.txt`).trim()
  const keywords = read(`fastlane/metadata/${locale}/keywords.txt`).trim()
  if (Array.from(subtitle).length > 30) throw new Error(`${locale} subtitle exceeds 30 characters.`)
  if (Buffer.byteLength(keywords) > 100) throw new Error(`${locale} keywords exceed 100 bytes.`)
}

console.log(`iOS ${version} is centralized across Xcode, Fastlane, and TestFlight verification.`)
