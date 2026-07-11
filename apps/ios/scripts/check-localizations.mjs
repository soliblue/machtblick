import { readdirSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const iosDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const copySource = readFileSync(resolve(iosDirectory, "src/Core/Copy.swift"), "utf8")
const catalog = JSON.parse(
  readFileSync(resolve(iosDirectory, "src/Localizable.xcstrings"), "utf8"),
)
const lookupKeys = new Set(
  [...copySource.matchAll(/"((?:copy|format)\.[^"]+)"/g)].map((match) => match[1]),
)
const catalogKeys = Object.keys(catalog.strings)
const missingKeys = [...lookupKeys].filter((key) => !catalog.strings[key])
const extraKeys = catalogKeys.filter((key) => !lookupKeys.has(key))
const incompleteKeys = catalogKeys.filter((key) =>
  ["de", "en"].some(
    (locale) => !catalog.strings[key].localizations?.[locale]?.stringUnit?.value?.trim(),
  ),
)
const placeholders = (value) => value.match(/%(?:\d+\$)?(?:lld|ld|@|d|f)/g) ?? []
const mismatchedFormatKeys = catalogKeys.filter(
  (key) =>
    placeholders(catalog.strings[key].localizations.de.stringUnit.value).join(",") !==
    placeholders(catalog.strings[key].localizations.en.stringUnit.value).join(","),
)
const swiftSources = []
const collectSwiftSources = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) collectSwiftSources(path)
    else if (path.endsWith(".swift") && path !== resolve(iosDirectory, "src/Core/Copy.swift")) {
      swiftSources.push(readFileSync(path, "utf8"))
    }
  }
}
collectSwiftSources(resolve(iosDirectory, "src"))
const externalSource = swiftSources.join("\n")
const copyWithoutStrings = copySource.replace(/"(?:\\.|[^"\\])*"/g, "")
const unusedDeclarations = [
  ...copySource.matchAll(/static (?:var|func) ([A-Za-z0-9_]+)/g),
]
  .map((match) => match[1])
  .filter(
    (name) =>
      !new RegExp(`Copy\\.${name}\\b`).test(externalSource) &&
      [...copyWithoutStrings.matchAll(new RegExp(`\\b${name}\\b`, "g"))].length === 1,
  )

if (
  missingKeys.length ||
  extraKeys.length ||
  incompleteKeys.length ||
  mismatchedFormatKeys.length ||
  unusedDeclarations.length
) {
  throw new Error(
    [
      missingKeys.length ? `Missing catalog keys: ${missingKeys.join(", ")}` : "",
      extraKeys.length ? `Unused catalog keys: ${extraKeys.join(", ")}` : "",
      incompleteKeys.length ? `Incomplete catalog keys: ${incompleteKeys.join(", ")}` : "",
      mismatchedFormatKeys.length
        ? `Mismatched format placeholders: ${mismatchedFormatKeys.join(", ")}`
        : "",
      unusedDeclarations.length
        ? `Unused Copy declarations: ${unusedDeclarations.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  )
}

console.log(
  `${lookupKeys.size} Copy lookup keys and ${catalogKeys.length} catalog entries have German and English values.`,
)
