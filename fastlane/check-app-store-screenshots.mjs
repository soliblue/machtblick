import { readdir, readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const { locales, sources, screenshots } = JSON.parse(await readFile(new URL("./app-store-screenshots.json", import.meta.url)))
const source = fileURLToPath(new URL("./screenshot-source/", import.meta.url))
const output = fileURLToPath(new URL("./screenshots/", import.meta.url))

const dimensions = async (path) => {
  const png = await readFile(path)
  if (png.toString("ascii", 1, 4) !== "PNG") throw new Error(`${path} is not a PNG`)
  return [png.readUInt32BE(16), png.readUInt32BE(20)]
}

for (const locale of locales) {
  for (const sourceShot of sources) {
    const sourceSize = await dimensions(`${source}${locale.id}/${sourceShot.file}`)
    if (sourceSize.join("x") !== "1284x2778") throw new Error(`${locale.id}/${sourceShot.file} is ${sourceSize.join("x")}`)
  }
  for (const shot of screenshots) {
    const outputSize = await dimensions(`${output}${locale.id}/${shot.output}`)
    if (outputSize.join("x") !== "1284x2778") throw new Error(`${locale.id}/${shot.output} is ${outputSize.join("x")}`)
  }
}

const expectedSources = sources.map(({ file }) => file).sort()
const expected = screenshots.map(({ output }) => output).sort()
for (const locale of locales) {
  const captured = (await readdir(`${source}${locale.id}`)).filter((file) => file.endsWith(".png")).sort()
  if (JSON.stringify(captured) !== JSON.stringify(expectedSources)) throw new Error(`${locale.id} captured screenshot set does not match the manifest`)
  const rendered = (await readdir(`${output}${locale.id}`)).filter((file) => file.endsWith(".png")).sort()
  if (JSON.stringify(rendered) !== JSON.stringify(expected)) throw new Error(`${locale.id} rendered screenshot set does not match the manifest`)
}
console.log(`Verified ${locales.length * screenshots.length} localized App Store screenshots at 1284x2778`)
