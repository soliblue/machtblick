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

const root = fileURLToPath(new URL('..', import.meta.url))
const outDir = `${root}public/og/votes`
mkdirSync(outDir, { recursive: true })

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
db.close()

const summariesByVote = new Map()
for (const s of summaryRows) {
  const arr = summariesByVote.get(s.vote_id) ?? []
  arr.push(s)
  summariesByVote.set(s.vote_id, arr)
}

const formatDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

function donutSvg(p, size) {
  const segments = [
    { value: p.yes ?? 0, color: SUCCESS },
    { value: p.no ?? 0, color: DANGER },
    { value: p.abstain ?? 0, color: YELLOW },
    { value: p.absent ?? 0, color: ABSENT },
  ]
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${paths}<circle cx="50" cy="50" r="22" fill="#FFFFFF"/></svg>`
  return {
    type: 'img',
    props: { width: size, height: size, src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` },
  }
}

function el(type, style, children) {
  return { type, props: { style, children } }
}

function card(vote) {
  const accepted = vote.result === 'angenommen'
  const verdict = accepted ? SUCCESS : DANGER
  const parties = (summariesByVote.get(vote.id) ?? [])
    .filter((p) => !PARTY_LINE_EXCLUDED.has(p.party))
    .sort((a, b) => (b.yes - b.no) / (b.yes + b.no + b.abstain || 1) - (a.yes - a.no) / (a.yes + a.no + a.abstain || 1))
  const titleSize = vote.title.length <= 80 ? 58 : vote.title.length <= 140 ? 50 : 42
  return el('div', { width: 1200, height: 630, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', fontFamily: 'Fraunces', color: FG }, [
    el('div', { height: 10, width: 1200, backgroundColor: verdict, display: 'flex' }),
    el('div', { display: 'flex', justifyContent: 'center' }, [
      el('div', { backgroundColor: verdict, color: '#FFFFFF', fontSize: 19, fontWeight: 600, letterSpacing: 3, padding: '10px 36px 10px 39px', display: 'flex' }, 'MACHTBLICK'),
    ]),
    el('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '30px 64px 52px' }, [
      el('div', { display: 'flex', alignItems: 'center', fontSize: 21, fontWeight: 600, letterSpacing: 2.5 }, [
        el('span', { color: verdict, display: 'flex' }, accepted ? 'ANGENOMMEN' : 'ABGELEHNT'),
        el('span', { opacity: 0.4, padding: '0 14px', display: 'flex' }, '·'),
        el('span', { opacity: 0.7, display: 'flex' }, formatDate(vote.date).toUpperCase()),
      ]),
      el('div', { display: 'flex', marginTop: 26, fontSize: titleSize, fontWeight: 600, lineHeight: 1.15, lineClamp: 4 }, vote.title),
      el('div', { display: 'flex', flexGrow: 1 }),
      el('div', { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }, [
        el('div', { display: 'flex', gap: 48 }, [
          el('div', { display: 'flex', flexDirection: 'column' }, [
            el('div', { fontSize: 18, fontWeight: 600, letterSpacing: 2.5, color: SUCCESS, display: 'flex' }, 'JA'),
            el('div', { fontSize: 92, fontWeight: 700, lineHeight: 1, color: SUCCESS, display: 'flex', marginTop: 8 }, String(vote.yes ?? 0)),
          ]),
          el('div', { display: 'flex', flexDirection: 'column' }, [
            el('div', { fontSize: 18, fontWeight: 600, letterSpacing: 2.5, color: DANGER, display: 'flex' }, 'NEIN'),
            el('div', { fontSize: 92, fontWeight: 700, lineHeight: 1, color: DANGER, display: 'flex', marginTop: 8 }, String(vote.no ?? 0)),
          ]),
        ]),
        el('div', { display: 'flex', gap: 26 }, parties.map((p) =>
          el('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }, [
            donutSvg(p, 76),
            el('div', { fontSize: 14, fontWeight: 600, letterSpacing: 1, opacity: 0.7, display: 'flex' }, PARTY_SHORT[p.party] ?? p.party.toUpperCase()),
          ]),
        )),
      ]),
    ]),
  ])
}

const only = process.argv[2]
const targets = only ? votes.filter((v) => v.id === only || votes.indexOf(v) < Number(only)) : votes
const started = Date.now()
for (const vote of targets) {
  const svg = await satori(card(vote), { width: 1200, height: 630, fonts })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  writeFileSync(`${outDir}/${vote.id}.png`, png)
}
console.log(`og-images: ${targets.length} votes in ${((Date.now() - started) / 1000).toFixed(1)}s -> public/og/votes`)
