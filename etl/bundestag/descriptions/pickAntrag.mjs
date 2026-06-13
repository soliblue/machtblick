import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ANTRAG_FLAVORED = ['Antrag:', 'Gesetzentwurf:', 'Entschließungsantrag:', 'Änderungsantrag:']
const EXCLUDED = ['Beschlussempfehlung', 'Bericht:', 'Ergänzung', 'Wahlvorschlag', 'Unterrichtung', 'Verordnung']

function isAntragFlavored(title) {
  return ANTRAG_FLAVORED.some((p) => title.startsWith(p))
}

function isExcluded(title) {
  return EXCLUDED.some((p) => title.startsWith(p))
}

function drucksacheRank(label) {
  const m = label.match(/^(\d+)\/(\d+)$/)
  if (!m) return Number.MAX_SAFE_INTEGER
  return Number(m[1]) * 1_000_000 + Number(m[2])
}

export function pickAntragFromRows(rows) {
  const antrag = rows.filter((r) => isAntragFlavored(r.title) && !isExcluded(r.title))
  if (antrag.length === 0) return null
  antrag.sort((a, b) => drucksacheRank(a.label) - drucksacheRank(b.label))
  return { drucksacheId: antrag[0].label, pdfUrl: antrag[0].url, kind: 'antrag' }
}

export function pickAntrag(voteId, db) {
  return pickAntragFromRows(db.prepare(`SELECT label, title, url FROM vote_documents WHERE vote_id = ?`).all(voteId))
}

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = join(HERE, 'dip-cache')
const HANDZEICHEN_CACHE = join(HERE, '..', 'handzeichen', 'drucksachen')
await mkdir(CACHE_DIR, { recursive: true })

const API = 'https://search.dip.bundestag.de/api/v1'
const KEY = process.env.DIP_API_KEY ?? 'JuUJMTh.aode9HMRTazR7NwudVElhD26LeNADLxxST'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function dipFetch(url) {
  let attempt = 0
  while (true) {
    const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'machtblick-etl/0.1 (https://github.com/soli/machtblick)' } })
    const text = await res.text()
    if (text.startsWith('{')) return JSON.parse(text)
    attempt++
    if (attempt > 30) throw new Error(`DIP non-JSON after ${attempt} retries: ${url}`)
    await sleep(Math.min(300000, 10000 * attempt))
  }
}

async function loadDrucksache(dnr) {
  const fname = `d-${dnr.replace('/', '-')}.json`
  const shared = join(HANDZEICHEN_CACHE, fname)
  if (existsSync(shared)) return JSON.parse(readFileSync(shared, 'utf8'))
  const local = join(CACHE_DIR, fname)
  try { return JSON.parse(await readFile(local, 'utf8')) } catch {}
  const data = await dipFetch(`${API}/drucksache?apikey=${KEY}&f.dokumentnummer=${encodeURIComponent(dnr)}&format=json`)
  await writeFile(local, JSON.stringify(data, null, 2))
  await sleep(120)
  return data
}

function parseFallbackRefs(title) {
  const out = []
  const re = /Drucksachen?\s+((?:\d+\/\d+(?:\s+Nr\.\s*\d+)?(?:,\s*)?)+)/gi
  let m
  while ((m = re.exec(title)) !== null) {
    const nums = [...m[1].matchAll(/(\d+\/\d+)/g)].map((x) => x[1])
    const preceding = title.slice(Math.max(0, m.index - 100), m.index).toLowerCase()
    const isGesetz = /gesetzentwurf/.test(preceding)
    const isAntrag = /\bantrag\b/.test(preceding)
    for (const n of nums) out.push({ n, isGesetz, isAntrag })
  }
  return out
}

function rankFallback(refs, fullLower) {
  const gesetz = refs.filter((r) => r.isGesetz)
  if (gesetz.length) return gesetz.sort((a, b) => drucksacheRank(a.n) - drucksacheRank(b.n))[0].n
  const antrag = refs.filter((r) => r.isAntrag)
  if (antrag.length) return antrag.sort((a, b) => drucksacheRank(a.n) - drucksacheRank(b.n))[0].n
  const titleHasGesetz = /gesetz|entwurf/.test(fullLower)
  const titleHasAntrag = /\bantrag\b/.test(fullLower)
  const titleHasVerordnung = /verordnung/.test(fullLower)
  if (titleHasGesetz || titleHasAntrag || titleHasVerordnung) return refs.sort((a, b) => drucksacheRank(a.n) - drucksacheRank(b.n))[0].n
  return null
}

function findBeschluss(rows) {
  return rows.find((r) => {
    const t = (r.title || '').toLowerCase()
    return t.includes('beschlussempfehlung') || t.startsWith('ergänzung')
  })
}

function isSammelubersicht(title) {
  return /sammelüber(s|)icht/i.test(title)
}

function isWahleinspruch(title) {
  const t = title.toLowerCase()
  return /einspr/.test(t) && (/bundestagswahl/.test(t) || /wahl zum.*bundestag/.test(t))
}

function isVerordnung(title) {
  return title.startsWith('Verordnung:')
}

function isUnterrichtung(title) {
  return title.startsWith('Unterrichtung:')
}

function pickLinkedAntrag(voteId, db) {
  const row = db.prepare(`
    SELECT a.drucksache, a.drucksache_pdf_url
    FROM vote_antraege va
    INNER JOIN antraege a ON a.id = va.antrag_id
    WHERE va.vote_id = ?
      AND a.drucksache IS NOT NULL
      AND a.drucksache_pdf_url IS NOT NULL
    ORDER BY CASE a.type WHEN 'antrag' THEN 0 WHEN 'gesetzentwurf' THEN 1 WHEN 'entschließungsantrag' THEN 2 WHEN 'änderungsantrag' THEN 3 ELSE 4 END, a.drucksache
    LIMIT 1
  `).get(voteId)
  return row ? { drucksacheId: row.drucksache, pdfUrl: row.drucksache_pdf_url, kind: 'antrag' } : null
}

async function pickFromVoteDocument(voteId, db) {
  const row = db.prepare('SELECT document FROM votes WHERE id = ?').get(voteId)
  const document = row?.document || ''
  const refs = parseFallbackRefs(document)
  const target = refs.length > 0 ? rankFallback(refs, document.toLowerCase()) : null
  if (!target) return null
  const data = await loadDrucksache(target)
  const doc = data.documents?.find((d) => d.dokumentnummer === target) ?? data.documents?.[0]
  if (!doc?.fundstelle?.pdf_url) return null
  const lower = document.toLowerCase()
  const kind = /verordnung/.test(lower) ? 'verordnung' : /unterrichtung/.test(lower) ? 'unterrichtung' : 'antrag'
  return { drucksacheId: target, pdfUrl: doc.fundstelle.pdf_url, kind }
}

export async function pickAntragWithFallback(voteId, db) {
  const rows = db.prepare(`SELECT label, title, url FROM vote_documents WHERE vote_id = ?`).all(voteId)
  const primary = pickAntragFromRows(rows)
  if (primary) return primary
  const linked = pickLinkedAntrag(voteId, db)
  if (linked) return linked
  const voteDocument = await pickFromVoteDocument(voteId, db)
  if (voteDocument) return voteDocument
  const beschluss = findBeschluss(rows)
  if (beschluss) {
    const btitle = beschluss.title || ''
    const refs = parseFallbackRefs(btitle)
    if (refs.length > 0) {
      const target = rankFallback(refs, btitle.toLowerCase())
      if (target) {
        const data = await loadDrucksache(target)
        const doc = data.documents?.find((d) => d.dokumentnummer === target) ?? data.documents?.[0]
        if (doc?.fundstelle?.pdf_url) return { drucksacheId: target, pdfUrl: doc.fundstelle.pdf_url, kind: 'antrag' }
      }
    }
    if (isSammelubersicht(btitle) && beschluss.url) {
      return { drucksacheId: beschluss.label, pdfUrl: beschluss.url, kind: 'petitionen' }
    }
    if (isWahleinspruch(btitle) && beschluss.url) {
      return { drucksacheId: beschluss.label, pdfUrl: beschluss.url, kind: 'wahleinspruch' }
    }
  }
  const verordnung = rows.find((r) => isVerordnung(r.title || ''))
  if (verordnung && verordnung.url) {
    return { drucksacheId: verordnung.label, pdfUrl: verordnung.url, kind: 'verordnung' }
  }
  const unterrichtung = rows.find((r) => isUnterrichtung(r.title || ''))
  if (unterrichtung && unterrichtung.url) {
    return { drucksacheId: unterrichtung.label, pdfUrl: unterrichtung.url, kind: 'unterrichtung' }
  }
  return null
}
