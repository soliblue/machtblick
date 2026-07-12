import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const RAW = new URL('./raw/', import.meta.url).pathname
const OUT = new URL('./blocks/', import.meta.url).pathname
await mkdir(OUT, { recursive: true })

const OUTCOME = /\b(?:Damit\s+)?(?:Der|Die|Das)\s+[^.?!]{1,120}?\b(?:ist|sind)\s+(?:damit\s+)?(?:in\s+\w+\s+(?:Beratung|Lesung)\s+)?\b(angenommen|abgelehnt)\b(?:\s+worden)?[^.?!]{0,600}?\./g

function extractText(xml) {
  const m = xml.match(/<text>([\s\S]*?)<\/text>/)
  if (!m) return ''
  return m[1]
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
}

function extractDate(xml) {
  return xml.match(/<datum>(\d{4}-\d{2}-\d{2})<\/datum>/)?.[1] ?? null
}

function extractNumber(xml) {
  return xml.match(/<dokumentnummer>([^<]+)<\/dokumentnummer>/)?.[1] ?? null
}

function blocksFromProtocol(text) {
  const norm = text.replace(/\s+/g, ' ').trim()
  const outcomes = [...norm.matchAll(OUTCOME)]
  const blocks = []
  let prevEnd = 0
  for (const m of outcomes) {
    const blockStart = Math.max(prevEnd, m.index - 2000)
    const blockEnd = m.index + m[0].length
    const block = norm.slice(blockStart, blockEnd).trim()
    if (block.length < 200) continue
    if (/namentliche?\s+Abstimmung/i.test(block) && /Schriftführer/i.test(block)) continue
    blocks.push({ outcome: m[1], block })
    prevEnd = blockEnd
  }
  return blocks
}

const files = (await readdir(RAW)).filter((f) => f.endsWith('.xml')).sort()
let total = 0
for (const f of files) {
  const xml = await readFile(join(RAW, f), 'utf8')
  const text = extractText(xml)
  const date = extractDate(xml)
  const number = extractNumber(xml)
  const blocks = blocksFromProtocol(text)
  await writeFile(join(OUT, f.replace('.xml', '.json')), JSON.stringify({ number, date, blocks }, null, 2))
  total += blocks.length
  console.log(`${number} (${date}): ${blocks.length} blocks`)
}
console.log(`\ntotal blocks: ${total}`)
