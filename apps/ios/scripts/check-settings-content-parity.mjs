import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { runInNewContext } from "node:vm"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const read = (path) => readFileSync(resolve(root, path), "utf8")
const loadCopy = (path) => {
  const source = read(path)
    .replace(/^export type Source = .*$/m, "")
    .replace("export const COPY =", "const COPY =")
    .replaceAll(" as Source[]", "")
  return runInNewContext(`${source}\nCOPY`)
}
const push = (tokens, kind, value = null) => tokens.push({ kind, value })
const section = (tokens, heading) => {
  push(tokens, "section")
  push(tokens, "heading", heading)
}
const sources = (tokens, values, note = null) => {
  push(tokens, "sources")
  for (const source of values) {
    push(tokens, "source")
    push(tokens, "name", source.name ?? null)
    push(tokens, "url", source.url)
    push(tokens, "display", source.display)
    push(tokens, "description", source.desc)
  }
  push(tokens, "note", note)
}
const paragraph = (tokens, value) => push(tokens, "paragraph", value)
const linkedParagraph = (tokens, text, linkLabel, url) => {
  if (text.split(linkLabel).length !== 2) {
    throw new Error(`Linked paragraph must contain ${linkLabel} exactly once.`)
  }
  push(tokens, "linkedParagraph")
  push(tokens, "text", text)
  push(tokens, "linkLabel", linkLabel)
  push(tokens, "url", url)
}
const subsection = (tokens, value) => push(tokens, "subsection", value)
const contacts = (tokens, values) => {
  push(tokens, "contacts")
  for (const contact of values) {
    push(tokens, "contact")
    push(tokens, "label", contact.label)
    push(tokens, "email", contact.email)
  }
}
const footnote = (tokens, value) => push(tokens, "footnote", value)

const methodik = loadCopy("apps/bundestag/src/views/methodik/methodikCopy.ts")
const methodikView = read("apps/bundestag/src/views/methodik/Methodik.tsx")
const methodikImprintPath = methodikView.match(/withLocale\('([^']+)', locale\)/)?.[1]
if (methodikImprintPath !== "/imprint/") {
  throw new Error("Could not read the methodology imprint destination.")
}
const aboutData = (locale) => {
  const copy = methodik[locale]
  const tokens = []
  push(tokens, "title", copy.title)
  section(tokens, copy.sourcesHeading)
  sources(tokens, copy.sources)
  section(tokens, copy.refreshHeading)
  paragraph(tokens, copy.refreshBody)
  section(tokens, copy.aiHeading)
  paragraph(tokens, copy.aiBody)
  section(tokens, copy.operatorHeading)
  linkedParagraph(
    tokens,
    `${copy.operatorBefore}${copy.operatorLink}${copy.operatorAfter}`,
    copy.operatorLink,
    `https://machtblick.de${locale === "de" ? "" : "/en"}${methodikImprintPath}`,
  )
  return tokens
}

const impressum = loadCopy("apps/bundestag/src/views/impressum/impressumCopy.ts")
const impressumView = read("apps/bundestag/src/views/impressum/Impressum.tsx")
const abgeordnetenwatch = impressumView.match(
  /<a href="(https:\/\/www\.abgeordnetenwatch[^"]+)"[^>]*>([^<]+)<\/a>/,
)
const abgeordnetenwatchHeading = impressumView.match(/<h3[^>]*>([^<{]+)<\/h3>/)?.[1].trim()
if (!abgeordnetenwatch || !abgeordnetenwatchHeading) {
  throw new Error("Could not read the abgeordnetenwatch source block.")
}
const imprint = (locale) => {
  const copy = impressum[locale]
  const tokens = []
  push(tokens, "title", copy.title)
  section(tokens, copy.whatHeading)
  paragraph(tokens, copy.whatBody)
  section(tokens, copy.sourcesHeading)
  subsection(tokens, copy.bundestagHeading)
  sources(tokens, copy.sourcesBundestag, copy.licenseNote)
  subsection(tokens, abgeordnetenwatchHeading)
  sources(tokens, [
    {
      name: null,
      url: abgeordnetenwatch[1],
      display: abgeordnetenwatch[2],
      desc: copy.abgeordnetenwatchDesc,
    },
  ])
  subsection(tokens, copy.imagesHeading)
  sources(tokens, copy.sourcesImages)
  section(tokens, copy.principlesHeading)
  paragraph(tokens, copy.principlesBody)
  section(tokens, copy.contactHeading)
  contacts(tokens, copy.contacts)
  section(tokens, copy.operatorHeading)
  linkedParagraph(
    tokens,
    `${copy.operatorBody}${copy.operatorName}.`,
    copy.operatorName,
    copy.operatorUrl,
  )
  return tokens
}

const privacyView = read("apps/bundestag/src/views/datenschutz/Datenschutz.tsx")
const privacyValues = [...privacyView.matchAll(/<(h1|p)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(
  (match) =>
    match[2]
      .replace(/\{' '\}/g, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
)
const privacyLabels = [...privacyView.matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].map((match) =>
  match[1].replace(/\s+/g, " ").trim(),
)
const privacyLinks = [...privacyView.matchAll(/href="([^"]+)"/g)].map((match) => match[1])
if (privacyValues.length !== 6 || privacyLabels.length !== 2 || privacyLinks.length !== 2) {
  throw new Error("Could not read both localized privacy pages.")
}
const privacy = (locale) => {
  const offset = locale === "de" ? 3 : 0
  const linkOffset = locale === "de" ? 1 : 0
  const tokens = []
  push(tokens, "title", privacyValues[offset])
  section(tokens, null)
  linkedParagraph(
    tokens,
    privacyValues[offset + 1],
    privacyLabels[linkOffset],
    `https://machtblick.de${privacyLinks[linkOffset]}`,
  )
  footnote(tokens, privacyValues[offset + 2])
  return tokens
}

const specs = [
  ["section", /SettingsContentSection\(/g, () => null],
  ["source", /SettingsContentSource\(/g, () => null],
  ["contact", /SettingsContentContact\(/g, () => null],
  ["title", /\btitle: "([^"]*)"/g, (match) => match[1]],
  ["heading", /\bheading: (?:nil|"([^"]*)")/g, (match) => match[1] ?? null],
  ["paragraph", /\.paragraph\(\s*"([^"]*)"\s*\)/g, (match) => match[1]],
  ["linkedParagraph", /\.linkedParagraph\(/g, () => null],
  ["text", /\btext: "([^"]*)"/g, (match) => match[1]],
  ["linkLabel", /\blinkLabel: "([^"]*)"/g, (match) => match[1]],
  ["url", /\burl: URL\(string: "([^"]*)"\)!/g, (match) => match[1]],
  ["subsection", /\.subsection\("([^"]*)"\)/g, (match) => match[1]],
  ["sources", /\.sources\(/g, () => null],
  ["name", /\bname: (?:nil|"([^"]*)")/g, (match) => match[1] ?? null],
  ["display", /\bdisplay: "([^"]*)"/g, (match) => match[1]],
  ["description", /\bdescription: "([^"]*)"/g, (match) => match[1]],
  ["note", /\bnote: (?:nil|"([^"]*)")/g, (match) => match[1] ?? null],
  ["contacts", /\.contacts\(/g, () => null],
  ["label", /\blabel: "([^"]*)"/g, (match) => match[1]],
  ["email", /\bemail: "([^"]*)"/g, (match) => match[1]],
  ["footnote", /\.footnote\("([^"]*)"\)/g, (match) => match[1]],
]
const nativeTokens = (source) =>
  specs
    .flatMap(([kind, pattern, value]) =>
      [...source.matchAll(pattern)].map((match) => ({
        index: match.index,
        token: { kind, value: value(match) },
      })),
    )
    .sort((a, b) => a.index - b.index)
    .map(({ token }) => token)
const localizedSegments = (path) => {
  const raw = read(path)
  const source = [...raw.matchAll(/private static let (\w+) = URL\(string: "([^"]*)"\)!/g)].reduce(
    (text, [, name, url]) =>
      text.replace(new RegExp(`\\burl: ${name}\\b`, "g"), `url: URL(string: "${url}")!`),
    raw,
  )
  const german = source.indexOf("private static let german")
  const english = source.indexOf("private static let english")
  if (german < 0 || english < 0 || german > english) {
    throw new Error(`Could not read localized native content from ${path}.`)
  }
  return {
    de: source.slice(german, english),
    en: source.slice(english),
  }
}
const contracts = [
  ["aboutData", "apps/ios/src/Features/Settings/Logic/AboutDataContent.swift", aboutData],
  ["imprint", "apps/ios/src/Features/Settings/Logic/ImprintContent.swift", imprint],
  ["privacy", "apps/ios/src/Features/Settings/Logic/PrivacyContent.swift", privacy],
]
const mismatches = []
let fieldCount = 0
for (const [page, path, websiteTokens] of contracts) {
  const segments = localizedSegments(path)
  for (const locale of ["de", "en"]) {
    const expected = websiteTokens(locale)
    const actual = nativeTokens(segments[locale])
    const nativeLiterals = [...segments[locale].matchAll(/"([^"]*)"/g)].map((match) => match[1]).sort()
    const tokenLiterals = actual.flatMap(({ value }) => typeof value === "string" ? [value] : []).sort()
    if (JSON.stringify(nativeLiterals) !== JSON.stringify(tokenLiterals)) {
      mismatches.push(`${page}.${locale} contains untracked native copy.`)
    }
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      mismatches.push(
        `${page}.${locale}\nexpected ${JSON.stringify(expected)}\nactual ${JSON.stringify(actual)}`,
      )
    }
    fieldCount += expected.length
  }
}
const model = read("apps/ios/src/Features/Settings/Logic/SettingsContent.swift")
if (!model.includes('URL(string: "mailto:\\(email)")!')) {
  mismatches.push("Settings contacts do not use native mailto links.")
}
if (mismatches.length) {
  throw new Error(`Native Settings content differs from the website:\n${mismatches.join("\n")}`)
}

console.log(`${fieldCount} ordered native fields match all three website pages in German and English.`)
