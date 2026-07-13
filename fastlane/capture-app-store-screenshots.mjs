import { execFileSync } from "node:child_process"
import { cp, mkdtemp, mkdir, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const { locales, sources } = JSON.parse(await readFile(new URL("./app-store-screenshots.json", import.meta.url)))
const source = fileURLToPath(new URL("./screenshot-source/", import.meta.url))
const simulatorName = process.env.SCREENSHOT_SIMULATOR_NAME ?? "Machtblick Screenshots iPhone"
const xcrun = (...args) => execFileSync("xcrun", args, { cwd: root, encoding: "utf8" }).trim()
const devices = Object.values(JSON.parse(xcrun("simctl", "list", "devices", "available", "-j")).devices).flat()
let simulator = process.env.SCREENSHOT_SIMULATOR_ID
  ? devices.find(({ udid }) => udid === process.env.SCREENSHOT_SIMULATOR_ID)
  : devices.find(({ name }) => name === simulatorName)

if (!simulator) {
  const runtimes = JSON.parse(xcrun("simctl", "list", "runtimes", "available", "-j")).runtimes
    .filter(({ platform }) => platform === "iOS")
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
  const udid = xcrun(
    "simctl",
    "create",
    simulatorName,
    "com.apple.CoreSimulator.SimDeviceType.iPhone-13-Pro-Max",
    runtimes[0].identifier,
  )
  simulator = { name: simulatorName, state: "Shutdown", udid }
}

if (simulator.state === "Shutdown") xcrun("simctl", "boot", simulator.udid)
xcrun("simctl", "bootstatus", simulator.udid, "-b")
xcrun(
  "simctl",
  "status_bar",
  simulator.udid,
  "override",
  "--time",
  "09:41",
  "--batteryState",
  "charged",
  "--batteryLevel",
  "100",
  "--wifiBars",
  "3",
  "--cellularBars",
  "4",
)

const temp = await mkdtemp(join(tmpdir(), "machtblick-screenshots-"))
const result = join(temp, "screenshots.xcresult")
const attachments = join(temp, "attachments")

execFileSync(
  "xcodebuild",
  [
    "test",
    "-project",
    "apps/ios/iOS.xcodeproj",
    "-scheme",
    "Machtblick",
    "-configuration",
    "Debug",
    "-destination",
    `id=${simulator.udid}`,
    "-parallel-testing-enabled",
    "NO",
    "-only-testing:MachtblickUITests/AppStoreScreenshotUITests",
    "-resultBundlePath",
    result,
  ],
  { cwd: root, stdio: "inherit" },
)

await mkdir(attachments)
xcrun("xcresulttool", "export", "attachments", "--path", result, "--output-path", attachments)
const exported = JSON.parse(await readFile(join(attachments, "manifest.json")))
  .flatMap(({ attachments }) => attachments)

await rm(source, { recursive: true, force: true })
for (const locale of locales) {
  await mkdir(join(source, locale.id), { recursive: true })
  for (const sourceShot of sources) {
    const attachment = exported.find(({ suggestedHumanReadableName }) =>
      suggestedHumanReadableName.startsWith(`${locale.id}--${sourceShot.file.replace(/\.png$/, "_")}`))
    if (!attachment) throw new Error(`Missing UI test attachment for ${locale.id}/${sourceShot.file}`)
    await cp(join(attachments, attachment.exportedFileName), join(source, locale.id, sourceShot.file))
  }
}

xcrun("simctl", "status_bar", simulator.udid, "clear")
await rm(temp, { recursive: true })
console.log(`Captured ${locales.length * sources.length} localized screenshots on ${simulator.name}`)
