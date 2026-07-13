import { existsSync } from "node:fs"
import { mkdir, readFile, rm } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const root = fileURLToPath(new URL("../", import.meta.url))
const source = fileURLToPath(new URL("./screenshot-source/", import.meta.url))
const output = fileURLToPath(new URL("./screenshots/", import.meta.url))
const { locales, screenshots } = JSON.parse(await readFile(new URL("./app-store-screenshots.json", import.meta.url)))
const font = (await readFile(`${root}apps/ios/src/Fonts/Fraunces-SemiBold.ttf`)).toString("base64")
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(chrome) ? { executablePath: chrome } : {}),
})

const escape = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")

const headline = (copy) => copy.highlights.reduce(
  (value, highlight) => value.replace(
    escape(highlight.text),
    `<span style="background:${highlight.background}">${escape(highlight.text)}</span>`,
  ),
  escape(copy.title),
)

const device = (image, className) => `
  <div class="device ${className}">
    <i class="side left"></i><i class="side right"></i>
    <img src="data:image/png;base64,${image}" alt="">
  </div>`

const callouts = (copy) => copy.callouts?.map((callout) => `
  <div class="callout" style="--callout:${callout.color}">
    <strong>${escape(callout.value)}</strong>
    <span>${escape(callout.label)}</span>
  </div>`).join("") ?? ""

const content = (shot, copy, images) => ({
  below: `
    <header class="copy copy-top"><h1>${headline(copy)}</h1></header>
    ${device(images[0], "phone-below")}
    <div class="callout-stack callouts-below">${callouts(copy)}</div>`,
  above: `
    ${device(images[0], "phone-above")}
    <div class="callout-stack callouts-above">${callouts(copy)}</div>
    <header class="copy copy-bottom"><h1>${headline(copy)}</h1></header>`,
  split: `
    ${device(images[0], "phone-split-top")}
    <header class="copy copy-middle"><h1>${headline(copy)}</h1></header>
    ${device(images[1], "phone-split-bottom")}`,
  side: `
    <header class="copy copy-side"><h1>${headline(copy)}</h1></header>
    <div class="callout-stack callouts-side">${callouts(copy)}</div>
    ${device(images[0], "phone-side")}`,
})[shot.layout]

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })

for (const locale of locales) {
  await mkdir(`${output}${locale.id}`, { recursive: true })
  for (const shot of screenshots) {
    const copy = shot.copy[locale.id]
    const images = await Promise.all(shot.sources.map(async (file) =>
      (await readFile(`${source}${locale.id}/${file}`)).toString("base64")))
    const page = await browser.newPage({ viewport: { width: 1284, height: 2778 } })
    await page.setContent(`<!doctype html>
<html>
<head>
<style>
@font-face { font-family: Fraunces; src: url(data:font/ttf;base64,${font}); font-weight: 600; }
* { box-sizing: border-box; }
html, body { width: 1284px; height: 2778px; margin: 0; overflow: hidden; }
body { background: ${shot.background}; color: ${shot.ink}; font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif; }
.canvas { position: relative; width: 100%; height: 100%; overflow: hidden; }
.copy { position: absolute; z-index: 6; }
h1 { margin: 0; font-family: Fraunces, Georgia, serif; font-size: 112px; font-weight: 600; line-height: 0.96; letter-spacing: 0; }
h1 span { padding: 0 12px 7px; border-radius: 8px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.copy-top { top: 84px; left: 72px; width: 1120px; }
.copy-bottom { top: 2010px; left: 72px; width: 1120px; }
.copy-middle { top: 950px; left: 92px; width: 1100px; text-align: center; }
.copy-side { top: 80px; left: 68px; width: 1100px; }
.device { position: absolute; z-index: 3; padding: 24px; border-radius: 126px; background: #101010; box-shadow: 0 44px 100px rgba(10, 10, 10, 0.25); }
.device img { display: block; width: 100%; height: auto; border-radius: 102px; background: white; }
.side { position: absolute; z-index: -1; width: 18px; background: #101010; }
.side.left { left: -13px; top: 360px; height: 170px; border-radius: 8px 0 0 8px; }
.side.right { right: -13px; top: 440px; height: 230px; border-radius: 0 8px 8px 0; }
.phone-below { top: 710px; left: 132px; width: 1020px; }
.phone-above { top: -80px; left: 182px; width: 920px; }
.phone-split-top { top: -1180px; left: 92px; width: 900px; transform: rotate(-4deg); }
.phone-split-bottom { top: 1820px; left: 292px; width: 900px; transform: rotate(4deg); }
.phone-side { top: 650px; left: 486px; width: 840px; transform: rotate(4deg); }
.callout-stack { position: absolute; z-index: 7; }
.callout { display: flex; align-items: baseline; gap: 16px; width: max-content; min-width: 260px; padding: 20px 24px 18px; border-left: 14px solid var(--callout); border-radius: 14px; background: white; box-shadow: 0 22px 50px rgba(10, 10, 10, 0.18); }
.callout strong { font-family: Fraunces, Georgia, serif; font-size: 58px; line-height: 1; letter-spacing: 0; }
.callout span { font-size: 24px; line-height: 1; letter-spacing: 0; }
.callouts-below { inset: 610px 34px auto 38px; display: flex; justify-content: space-between; }
.callouts-below .callout:first-child { transform: rotate(-5deg); }
.callouts-below .callout:last-child { transform: rotate(5deg); }
.callouts-above { inset: 1370px 26px auto 30px; display: flex; justify-content: space-between; }
.callouts-above .callout:first-child { transform: rotate(-4deg); }
.callouts-above .callout:last-child { transform: rotate(4deg); }
.callouts-side { top: 840px; left: 56px; display: grid; gap: 34px; }
.callouts-side .callout:first-child { transform: rotate(-3deg); }
.callouts-side .callout:last-child { transform: rotate(3deg); }
</style>
</head>
<body>
<main class="canvas">${content(shot, copy, images)}</main>
</body>
</html>`)
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: `${output}${locale.id}/${shot.output}` })
    await page.close()
  }
}

await browser.close()
