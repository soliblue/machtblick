import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import wawoff2 from 'wawoff2'

const SUCCESS = '#7AB87A'
const DANGER = '#B54E5E'
const YELLOW = '#D2BF72'
const ABSENT = '#C6C6C6'
const FG = '#0A0A0A'
const PARTY_LINE_EXCLUDED = new Set(['fraktionslos', 'Bundesregierung'])
const PARTY_SHORT = { 'CDU/CSU': 'CDU/CSU', SPD: 'SPD', AfD: 'AfD', 'B90/Grüne': 'GRÜNE', 'Die Linke': 'LINKE' }
const PARTIES = [
  { key: 'CDU/CSU', slug: 'cdu-csu', label: 'CDU/CSU', color: '#828CA0' },
  { key: 'SPD', slug: 'spd', label: 'SPD', color: '#FF3B30' },
  { key: 'AfD', slug: 'afd', label: 'AfD', color: '#6E9BF0' },
  { key: 'B90/Grüne', slug: 'gruene', label: 'Grüne', color: '#34C759' },
  { key: 'Die Linke', slug: 'linke', label: 'Linke', color: '#B98AEF' },
]

const root = fileURLToPath(new URL('..', import.meta.url))
mkdirSync(`${root}public/og/votes`, { recursive: true })
mkdirSync(`${root}public/og/parties`, { recursive: true })

const fonts = []
for (const weight of [600, 700]) {
  fonts.push({
    name: 'Fraunces',
    weight,
    style: 'normal',
    data: Buffer.from(await wawoff2.decompress(readFileSync(`${root}public/fonts/fraunces-latin-${weight}-normal.woff2`))),
  })
}

const db = new Database(`${root}../../db/machtblick.sqlite`, { readonly: true })
const votes = db.prepare(`
  SELECT id, COALESCE(clean_title, title) AS title, result, date, yes, no, abstain, absent
  FROM votes
  WHERE term_id = 21 AND procedural = 0 AND vote_type = 'namentlich'
`).all()
const summaryRows = db.prepare('SELECT vote_id, party, yes, no, abstain, absent FROM vote_party_summaries').all()
const latestVote = db.prepare("SELECT id, total_members FROM votes WHERE term_id = 21 AND vote_type = 'namentlich' ORDER BY date DESC LIMIT 1").get()
const seatRows = db.prepare('SELECT party, members FROM vote_party_summaries WHERE vote_id = ?').all(latestVote.id)
db.close()

const summariesByVote = new Map()
for (const s of summaryRows) {
  const arr = summariesByVote.get(s.vote_id) ?? []
  arr.push(s)
  summariesByVote.set(s.vote_id, arr)
}
const seatsByParty = new Map(seatRows.map((r) => [r.party, r.members]))

const formatDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

function donutSvg(segments, size, holeRatio = 0.48) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  let angle = -Math.PI / 2
  const paths = segments.map((s) => {
    if (s.value === 0) return ''
    if (s.value === total) return `<circle cx="50" cy="50" r="46" fill="${s.color}" stroke="#FFFFFF" stroke-width="2"/>`
    const sweep = (s.value / total) * Math.PI * 2
    const x1 = 50 + 46 * Math.cos(angle)
    const y1 = 50 + 46 * Math.sin(angle)
    const x2 = 50 + 46 * Math.cos(angle + sweep)
    const y2 = 50 + 46 * Math.sin(angle + sweep)
    const large = sweep > Math.PI ? 1 : 0
    angle += sweep
    return `<path d="M 50 50 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 46 46 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${s.color}" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${paths}<circle cx="50" cy="50" r="${(holeRatio * 46).toFixed(1)}" fill="#FFFFFF"/></svg>`
  return {
    type: 'img',
    props: { width: size, height: size, src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` },
  }
}

const partyDonut = (p, size) => donutSvg([
  { value: p.yes ?? 0, color: SUCCESS },
  { value: p.no ?? 0, color: DANGER },
  { value: p.abstain ?? 0, color: YELLOW },
  { value: p.absent ?? 0, color: ABSENT },
], size)

function el(type, style, children) {
  return { type, props: { style, children } }
}

function logoImg(slug, height) {
  const raw = readFileSync(`${root}public/parties/${slug}.svg`, 'utf8')
  const viewBox = raw.match(/viewBox="([\d.\s-]+)"/)?.[1]?.split(/\s+/).map(Number)
  const dims = viewBox
    ? { w: viewBox[2], h: viewBox[3] }
    : { w: parseFloat(raw.match(/width="([\d.]+)/)?.[1] ?? 1), h: parseFloat(raw.match(/height="([\d.]+)/)?.[1] ?? 1) }
  return {
    type: 'img',
    props: { width: Math.round(height * (dims.w / dims.h)), height, src: `data:image/svg+xml;base64,${Buffer.from(raw).toString('base64')}` },
  }
}

function frame(edgeColor, chipText, children) {
  return el('div', { width: 1200, height: 630, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', fontFamily: 'Fraunces', color: FG }, [
    el('div', { height: 12, width: 1200, backgroundColor: edgeColor, display: 'flex' }),
    el('div', { display: 'flex', justifyContent: 'center', marginTop: -12 }, [
      el('div', { backgroundColor: edgeColor, color: '#FFFFFF', fontSize: 22, fontWeight: 600, letterSpacing: 3.2, padding: '14px 40px 14px 43.2px', display: 'flex' }, chipText),
    ]),
    el('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '34px 64px 56px' }, children),
  ])
}

const metaRow = (right) => el('div', { display: 'flex', alignItems: 'center', fontSize: 21, fontWeight: 600, letterSpacing: 2.5, opacity: 0.7 }, [
  el('span', { display: 'flex' }, 'MACHTBLICK'),
  el('span', { padding: '0 14px', display: 'flex' }, '·'),
  el('span', { display: 'flex' }, right),
])

const numeralBlock = (caption, value, color) => el('div', { display: 'flex', flexDirection: 'column' }, [
  el('div', { fontSize: 18, fontWeight: 600, letterSpacing: 2.5, color, display: 'flex' }, caption),
  el('div', { fontSize: 100, fontWeight: 700, lineHeight: 1, color, display: 'flex', marginTop: 10 }, String(value)),
])

function voteCard(vote) {
  const accepted = vote.result === 'angenommen'
  const verdict = accepted ? SUCCESS : DANGER
  const parties = (summariesByVote.get(vote.id) ?? [])
    .filter((p) => !PARTY_LINE_EXCLUDED.has(p.party))
    .sort((a, b) => (b.yes - b.no) / (b.yes + b.no + b.abstain || 1) - (a.yes - a.no) / (a.yes + a.no + a.abstain || 1))
  const titleSize = vote.title.length <= 90 ? 64 : vote.title.length <= 150 ? 52 : 44
  return frame(verdict, accepted ? 'ANGENOMMEN' : 'ABGELEHNT', [
    metaRow(formatDate(vote.date).toUpperCase()),
    el('div', { display: 'flex', marginTop: 28, fontSize: titleSize, fontWeight: 600, lineHeight: 1.12, lineClamp: 4 }, vote.title),
    el('div', { display: 'flex', flexGrow: 1 }),
    el('div', { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }, [
      el('div', { display: 'flex', gap: 52 }, [
        numeralBlock('JA', vote.yes ?? 0, SUCCESS),
        numeralBlock('NEIN', vote.no ?? 0, DANGER),
      ]),
      el('div', { display: 'flex', gap: 28 }, parties.map((p) =>
        el('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }, [
          partyDonut(p, 84),
          el('div', { fontSize: 15, fontWeight: 600, letterSpacing: 1, opacity: 0.7, display: 'flex' }, PARTY_SHORT[p.party] ?? p.party.toUpperCase()),
        ]),
      )),
    ]),
  ])
}

function partyCard(party) {
  const seats = seatsByParty.get(party.key) ?? 0
  const chamber = latestVote.total_members
  return frame(party.color, party.label.toUpperCase(), [
    metaRow('FRAKTION IM 21. BUNDESTAG'),
    el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48, marginTop: 28 }, [
      el('div', { display: 'flex', fontSize: party.label.length > 5 ? 64 : 76, fontWeight: 600, lineHeight: 1.1 }, `${party.label} im Bundestag`),
      logoImg(party.slug, 104),
    ]),
    el('div', { display: 'flex', flexGrow: 1 }),
    el('div', { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }, [
      el('div', { display: 'flex', flexDirection: 'column' }, [
        numeralBlock('SITZE', seats, party.color),
        el('div', { fontSize: 18, fontWeight: 600, letterSpacing: 2.5, opacity: 0.7, display: 'flex', marginTop: 14 }, `VON ${chamber} ABGEORDNETEN`),
      ]),
      el('div', { display: 'flex', position: 'relative', width: 190, height: 190 }, [
        donutSvg([
          { value: seats, color: party.color },
          { value: chamber - seats, color: '#EDEDED' },
        ], 190, 0.55),
        el('div', { position: 'absolute', top: 0, left: 0, width: 190, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: party.color }, `${Math.round((seats / chamber) * 100)}%`),
      ]),
    ]),
  ])
}

async function render(node, path) {
  const svg = await satori(node, { width: 1200, height: 630, fonts })
  writeFileSync(path, new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng())
}

const only = process.argv[2]
const targets = only ? votes.filter((v) => v.id === only || votes.indexOf(v) < Number(only)) : votes
const started = Date.now()
for (const vote of targets) await render(voteCard(vote), `${root}public/og/votes/${vote.id}.png`)
for (const party of PARTIES) await render(partyCard(party), `${root}public/og/parties/${party.slug}.png`)
console.log(`og-images: ${targets.length} votes + ${PARTIES.length} parties in ${((Date.now() - started) / 1000).toFixed(1)}s -> public/og`)
