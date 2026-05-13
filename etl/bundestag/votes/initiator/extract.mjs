import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const xmlRoot = fileURLToPath(new URL('../../../bundestag-reden-xml/raw/xml/', import.meta.url))

const xmlCache = new Map()
const paragraphCache = new Map()

function loadXml(period, sitzung) {
  const key = `${period}${String(sitzung).padStart(3, '0')}`
  if (xmlCache.has(key)) return xmlCache.get(key)
  const path = `${xmlRoot}${key}.xml`
  const text = existsSync(path) ? readFileSync(path, 'utf8') : null
  xmlCache.set(key, text)
  return text
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
}

function normalize(s) {
  return s
    .replace(/[‐-―−]/g, '-')
    .replace(/[   ]/g, ' ')
    .replace(/[“”„‟«»"]/g, '"')
    .replace(/[‘’‚‛']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function fold(s) {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]/g, '')
}

function paragraphs(xml) {
  if (paragraphCache.has(xml)) return paragraphCache.get(xml)
  const out = []
  const re = /<p\s+klasse="([^"]+)">([\s\S]*?)<\/p>/g
  let m
  while ((m = re.exec(xml)) !== null) {
    out.push({ klasse: m[1], text: stripTags(m[2]).replace(/\s+/g, ' ').trim() })
  }
  paragraphCache.set(xml, out)
  return out
}

const PROPOSER_RE = /(?:Antrag|Gesetzentwurf|Entwurf eines|Entwurfs|eingebrachten Entwurfs)[^.]*?(?:der\s+Fraktion|des\s+Bundesrates|der\s+Bundesregierung|der\s+Fraktionen|den\s+Fraktionen|von\s+(?:den|der)\s+Fraktion)[^.]*/i

const STRUCTURAL_PROPOSER_RE = /von\s+(?:der|den)\s+Fraktion(?:en)?\s+(?:der\s+|des\s+)?(?:AfD|SPD|FDP|CDU|CSU|Die\s*Linke|B(?:Ü|UE|ü|u)NDNIS\s*90|B(?:ü|u)ndnis\s*90|CDU\s*\/\s*CSU)/i

function clauseFromParagraph(p) {
  if (!p) return null
  if (/Entschließungsantrag|Änderungsantrag/i.test(p.text)) return null
  const m = p.text.match(PROPOSER_RE)
  if (m) return m[0]
  if (STRUCTURAL_PROPOSER_RE.test(p.text)) return p.text
  if (/\bFraktion(?:en)?\s+(?:der\s+)?(?:AfD|SPD|FDP|CDU|CSU|Die\s*Linke|B(?:Ü|UE)NDNIS\s*90|B(?:ü|u)ndnis\s*90)/i.test(p.text)) return p.text
  if (/\bder\s+Bundesregierung\b|\bdes\s+Bundesrates\b/i.test(p.text)) return p.text
  return null
}

function isBeschlussempfehlungParagraph(p) {
  return /^Beschlussempfehlung(?:\s+und\s+Bericht)?\b/i.test(p.text)
}

function isStructuralBoundary(p) {
  return p.klasse === 'T_fett' || (p.klasse === 'T_ZP_NaS' && /^\s*(TOP|ZP|Tagesordnungspunkt|Zusatzpunkt)\b/i.test(p.text))
}

export function findClauseByTitle(xml, title) {
  const ps = paragraphs(xml)
  const wanted = normalize(title)
  const foldedWanted = fold(title)
  let idx = ps.findIndex((p) => p.klasse === 'T_fett' && normalize(p.text) === wanted)
  if (idx === -1) idx = ps.findIndex((p) => p.klasse === 'T_fett' && fold(p.text) === foldedWanted)
  if (idx === -1) return null
  for (let i = idx - 1; i >= 0; i--) {
    const p = ps[i]
    if (p.klasse === 'T_fett') return null
    if (p.klasse !== 'T_ZP_NaS' && p.klasse !== 'T_NaS') continue
    const clause = clauseFromParagraph(p)
    if (clause) return clause
  }
  return null
}

export function parseVoteId(id) {
  const m = id.match(/^pp(\d+)-(\d+)-/)
  return m ? { period: Number(m[1]), sitzung: Number(m[2]) } : null
}

export function parseDrucksachen(document) {
  if (!document) return []
  return [...document.matchAll(/\b\d+\/\d+\b/g)].map((x) => x[0])
}

function topBlocks(xml) {
  const out = []
  const re = /<tagesordnungspunkt\b[^>]*>([\s\S]*?)<\/tagesordnungspunkt>/g
  let m
  while ((m = re.exec(xml)) !== null) out.push(m[1])
  return out
}

function blockParagraphs(blockXml) {
  const out = []
  const re = /<p\s+klasse="([^"]+)">([\s\S]*?)<\/p>/g
  let m
  while ((m = re.exec(blockXml)) !== null) {
    out.push({ klasse: m[1], text: stripTags(m[2]).replace(/\s+/g, ' ').trim() })
  }
  return out
}

const DRUCKSACHE_J_RE = (drucksache) => {
  const esc = drucksache.replace(/\//g, '\\/')
  return new RegExp(`((?:Wahlvorschlag|Wahlvorschläge|Antrag|Gesetzentwurf|Entwurf)[^.]*?(?:der\\s+Fraktion(?:en)?[^.]*?|der\\s+Bundesregierung|des\\s+Bundesrates)[^.]*?auf\\s+(?:der\\s+)?Drucksache\\s*${esc})`, 'i')
}

function clauseFromBlock(block, drucksache) {
  const ps = blockParagraphs(block)
  for (const p of ps) {
    if (p.klasse !== 'J' && p.klasse !== 'J_1') continue
    if (/Entschließungsantrag|Änderungsantrag/i.test(p.text)) continue
    const m = p.text.match(DRUCKSACHE_J_RE(drucksache))
    if (m) return m[1]
  }
  const drsIdx = ps.findIndex((p) => p.klasse === 'T_Drs' && p.text.includes(drucksache))
  if (drsIdx === -1) return null
  for (let j = drsIdx - 1; j >= 0; j--) {
    const q = ps[j]
    if (q.klasse !== 'T_NaS' && q.klasse !== 'T_ZP_NaS' && q.klasse !== 'T_fett') continue
    if (isBeschlussempfehlungParagraph(q)) continue
    const clause = clauseFromParagraph(q)
    if (clause) return clause
  }
  return null
}

function clauseFromDrucksacheStructured(xml, drucksache) {
  for (const block of topBlocks(xml)) {
    const clause = clauseFromBlock(block, drucksache)
    if (clause) return clause
  }
  return null
}

export function extractClauseForDrucksache(xml, drucksache) {
  const structured = clauseFromDrucksacheStructured(xml, drucksache)
  if (structured) return structured
  const indices = []
  let i = 0
  while ((i = xml.indexOf(drucksache, i)) !== -1) {
    indices.push(i)
    i += drucksache.length
  }
  for (const idx of indices) {
    const start = Math.max(0, idx - 800)
    const window = xml.slice(start, idx)
    const cleanedWindow = window.replace(/(?:Entschließungs|Änderungs)antr(?:ag|äge)[^<]{0,300}/gi, ' ')
    const matches = [...cleanedWindow.matchAll(/(?:Antrag|Gesetzentwurf|Entwurf eines[^<]*?)\s+(?:der|des)\s+[^<]{0,400}?Fraktion[^<]{0,200}/gi)]
    if (matches.length) return matches[matches.length - 1][0]
    const govMatches = [...cleanedWindow.matchAll(/(?:Antrag|Gesetzentwurf|Entwurfs|eingebrachten Entwurfs)\s+(?:der\s+Bundesregierung|des\s+Bundesrates)/gi)]
    if (govMatches.length) return govMatches[govMatches.length - 1][0]
  }
  return null
}

function stripTitleSuffix(title) {
  return title.replace(/\s*\([^)]+\)\s*$/, '').trim()
}

const SIDE_MOTION_J_RE = (kind, drucksache) => {
  const esc = drucksache.replace(/\//g, '\\/')
  return new RegExp(`(${kind}\\s+(?:der|des)\\s+Fraktion(?:en)?[^.]*?auf\\s+(?:der\\s+)?Drucksache\\s*${esc})`, 'i')
}

function findSideMotionClause(xml, kind, drucksachen) {
  for (const block of topBlocks(xml)) {
    const ps = blockParagraphs(block)
    for (const p of ps) {
      if (p.klasse !== 'J' && p.klasse !== 'J_1') continue
      for (const d of drucksachen) {
        const m = p.text.match(SIDE_MOTION_J_RE(kind, d))
        if (m) return m[1]
      }
    }
  }
  return null
}

export function extractInitiatorClause(voteId, document, title) {
  const parsed = parseVoteId(voteId)
  if (!parsed) return null
  const xml = loadXml(parsed.period, parsed.sitzung)
  if (!xml) return null
  const nums = parseDrucksachen(document)
  if (title) {
    if (/Änderungsantrag/i.test(title) && nums.length) {
      const clause = findSideMotionClause(xml, 'Änderungsantrag', nums)
      if (clause) return clause
    }
    if (/Entschließungsantrag/i.test(title) && nums.length) {
      const clause = findSideMotionClause(xml, 'Entschließungsantrag', nums)
      if (clause) return clause
    }
    const byTitle = findClauseByTitle(xml, stripTitleSuffix(title))
    if (byTitle) return byTitle
  }
  if (!nums.length) return null
  const ordered = nums.length > 1 ? [...nums].reverse() : nums
  for (const n of ordered) {
    const clause = clauseFromDrucksacheStructured(xml, n)
    if (clause) return clause
  }
  for (const n of ordered) {
    const clause = extractClauseForDrucksache(xml, n)
    if (clause) return clause
  }
  return null
}
