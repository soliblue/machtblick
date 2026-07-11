import { existsSync } from "node:fs"
import { mkdir, readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const root = fileURLToPath(new URL("../", import.meta.url))
const source = fileURLToPath(new URL("./screenshot-source/", import.meta.url))
const output = fileURLToPath(new URL("./screenshots/de-DE/", import.meta.url))
const font = (await readFile(`${root}apps/ios/src/Fonts/Fraunces-SemiBold.ttf`)).toString("base64")
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const browser = await chromium.launch({
    headless: true,
    ...(existsSync(chrome) ? { executablePath: chrome } : {}),
})

const shots = [
    {
        source: "iphone-abstimmungen.png",
        output: "01-iphone-65-abstimmungen.png",
        device: "phone",
        width: 1284,
        height: 2778,
        title: "Was der Bundestag beschließt",
        subtitle: "Abstimmungen mit Kontext statt nur Titel.",
        background: "#f2f6f1",
        accent: "#70ae78",
    },
    {
        source: "iphone-ergebnis.png",
        output: "02-iphone-65-ergebnis.png",
        device: "phone",
        width: 1284,
        height: 2778,
        title: "Wer dafür und dagegen stimmt",
        subtitle: "Ergebnis und Fraktionslinien auf einen Blick.",
        background: "#f7f7f7",
        accent: "linear-gradient(90deg, #70ae78 0 50%, #b94f61 50% 100%)",
    },
    {
        source: "iphone-reden-zusammenfassung.png",
        output: "03-iphone-65-reden-zusammenfassung.png",
        device: "phone",
        width: 1284,
        height: 2778,
        title: "Was die Fraktionen dazu sagen",
        subtitle: "Positionen aus den Reden kompakt zusammengefasst.",
        background: "#f2f4f7",
        accent: "#7189b8",
    },
    {
        source: "iphone-reden.png",
        output: "04-iphone-65-reden.png",
        device: "phone",
        width: 1284,
        height: 2778,
        title: "Wie die Debatte verlief",
        subtitle: "Alle Redebeiträge in ihrer Reihenfolge nachvollziehen.",
        background: "#f7f7f7",
        accent: "#828ca0",
    },
    {
        source: "iphone-abgeordnete.png",
        output: "05-iphone-65-abgeordnete.png",
        device: "phone",
        width: 1284,
        height: 2778,
        title: "Wer im Bundestag sitzt",
        subtitle: "Nach Alter, Geschlecht und Fraktion filtern.",
        background: "#f2f4f7",
        accent: "#7189b8",
    },
    {
        source: "iphone-fraktion.png",
        output: "06-iphone-65-fraktion.png",
        device: "phone",
        width: 1284,
        height: 2778,
        title: "So stimmt eine Fraktion",
        subtitle: "Geschlossenheit, Anwesenheit und Anträge im Blick.",
        background: "#f4f4f2",
        accent: "#828ca0",
    },
]

await mkdir(output, { recursive: true })

for (const shot of shots) {
    const image = (await readFile(`${source}${shot.source}`)).toString("base64")
    const arcs = Array.from(
        { length: 7 },
        (_, index) => `<i style="inset:${index * 34}px ${index * 34}px 0"></i>`,
    ).join("")
    const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } })
    await page.setContent(`<!doctype html>
<html>
<head>
<style>
@font-face { font-family: Fraunces; src: url(data:font/ttf;base64,${font}); font-weight: 600; }
* { box-sizing: border-box; }
html, body { width: ${shot.width}px; height: ${shot.height}px; margin: 0; overflow: hidden; }
body { background: ${shot.background}; color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif; }
.canvas { position: relative; width: 100%; height: 100%; overflow: hidden; }
.header { position: absolute; z-index: 3; top: ${shot.device === "phone" ? 84 : 74}px; left: ${shot.device === "phone" ? 86 : 112}px; right: ${shot.device === "phone" ? 86 : 112}px; }
h1 { width: ${shot.device === "phone" ? 1060 : 1740}px; margin: 0; font-family: Fraunces, Georgia, serif; font-size: ${shot.device === "phone" ? 100 : 118}px; font-weight: 600; line-height: 0.98; letter-spacing: 0; }
.subtitle { width: ${shot.device === "phone" ? 1080 : 1760}px; margin-top: ${shot.device === "phone" ? 28 : 26}px; font-size: ${shot.device === "phone" ? 78 : 92}px; line-height: 1.06; color: rgba(10, 10, 10, 0.7); }
.rule { width: ${shot.device === "phone" ? 154 : 210}px; height: ${shot.device === "phone" ? 9 : 11}px; margin-top: ${shot.device === "phone" ? 38 : 34}px; background: ${shot.accent}; }
.hemicycle { position: absolute; z-index: 1; top: ${shot.device === "phone" ? 292 : 250}px; right: ${shot.device === "phone" ? -120 : 30}px; width: ${shot.device === "phone" ? 620 : 760}px; height: ${shot.device === "phone" ? 310 : 380}px; opacity: 0.15; }
.hemicycle i { position: absolute; display: block; border: ${shot.device === "phone" ? 8 : 10}px dotted #0a0a0a; border-bottom: 0; border-radius: 760px 760px 0 0; }
.device-wrap { position: absolute; z-index: 2; top: 680px; left: 50%; transform: translateX(-50%); }
.device { position: relative; background: #111; box-shadow: 0 36px 80px rgba(10, 10, 10, 0.2); }
.device.phone { width: 920px; padding: 25px; border-radius: 120px; }
.device.tablet { width: 1600px; padding: 28px; border-radius: 88px; }
.device img { display: block; width: 100%; height: auto; object-fit: cover; background: white; }
.device.phone img { border-radius: 96px; }
.device.tablet img { border-radius: 62px; }
.side { position: absolute; z-index: -1; background: #111; }
.phone .side.left { left: -13px; top: 360px; width: 18px; height: 170px; border-radius: 8px 0 0 8px; }
.phone .side.right { right: -13px; top: 440px; width: 18px; height: 230px; border-radius: 0 8px 8px 0; }
.tablet .side.left { left: -12px; top: 290px; width: 16px; height: 210px; border-radius: 8px 0 0 8px; }
.tablet .side.right { right: -12px; top: 340px; width: 16px; height: 260px; border-radius: 0 8px 8px 0; }
</style>
</head>
<body>
<main class="canvas">
  <header class="header">
    <h1>${shot.title}</h1>
    <div class="subtitle">${shot.subtitle}</div>
    <div class="rule"></div>
  </header>
  <div class="hemicycle">${arcs}</div>
  <div class="device-wrap">
    <div class="device ${shot.device}">
      <span class="side left"></span><span class="side right"></span>
      <img src="data:image/png;base64,${image}" alt="">
    </div>
  </div>
</main>
</body>
</html>`)
    await page.screenshot({ path: `${output}${shot.output}` })
    await page.close()
}

await browser.close()
