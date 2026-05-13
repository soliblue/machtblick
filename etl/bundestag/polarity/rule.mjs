import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const CACHE_DIR = new URL('../handzeichen/drucksachen/', import.meta.url).pathname

const INVERTED_TITLE_PATTERNS = [
  /^Ablehnung\s+(?:eines|des|der)\s+Antrags?\b/i,
  /^Ablehnung\s+der\s+Streichung\b/i,
  /^Ablehnung\s+des\s+\w+-?\s*Antrags\b/i,
  /\bAntrag\b[^.]*?\s+ablehnen\b/i,
  /\bAntrag\b[^.]*?\s+abzulehnen\b/i,
  /^Beschlussempfehlung\b[^.]*?\bablehnen\b/i,
  /\bEmpfehlung\s+(?:zur|der)\s+Ablehnung\b/i,
  /\bBeschlussempfehlung\s+(?:zur|auf)\s+Ablehnung\b/i,
]

const PROCEDURAL_PREFIX_STRIPPERS = [
  /^Ablehnung\s+eines\s+Antrags\s+(zur|zum|zu|gegen|über|für|auf|der|des)\s+/i,
  /^Ablehnung\s+eines\s+(?:[A-ZÄÖÜ]\w+-)?Antrags\s*:\s*/i,
  /^Ablehnung\s+des\s+(?:[A-ZÄÖÜ]\w+-)?Antrags\s*:\s*/i,
  /^Ablehnung\s+der\s+/i,
]

export function hasInvertedTitleShape(title) {
  return INVERTED_TITLE_PATTERNS.some((re) => re.test(title))
}

export function stripProceduralPrefix(title) {
  for (const re of PROCEDURAL_PREFIX_STRIPPERS) {
    if (re.test(title)) {
      const stripped = title.replace(re, '').trim()
      if (stripped.length >= 8) {
        const first = stripped[0]
        return first === first.toUpperCase() ? stripped : stripped[0].toUpperCase() + stripped.slice(1)
      }
    }
  }
  return null
}

export async function readDrucksacheCache(dnr) {
  const path = join(CACHE_DIR, `d-${dnr.replace('/', '-')}.json`)
  try {
    const raw = JSON.parse(await readFile(path, 'utf8'))
    return raw.documents?.[0] ?? null
  } catch {
    return null
  }
}

export function extractDrucksachen(document) {
  if (!document) return []
  return [...document.matchAll(/\b(\d+\/\d+)\b/g)].map((m) => m[1])
}

export function underlyingTitleFromCache(doc) {
  const bezug = doc?.vorgangsbezug?.[0]?.titel
  if (!bezug) return null
  return bezug.replace(/\s+/g, ' ').trim()
}

export function isBeschlussempfehlungZurAblehnung(doc) {
  if (doc?.drucksachetyp !== 'Beschlussempfehlung') return false
  const t = (doc?.titel ?? '').toLowerCase()
  return /ablehnung|abzulehnen/.test(t)
}
