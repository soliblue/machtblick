import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const EXTRACTED = new URL('../bundestag/handzeichen/extracted/', import.meta.url)

const ABGG_TITLE = 'Abweichung vom Anpassungsverfahren der Abgeordnetenentschädigung für das Jahr 2026'

const PATCHES = [
  { file: '21-90.json', index: 15, id: 'pp21-90-15-gesetzentwurf', title: ABGG_TITLE, drucksache: ['21/6851', '21/6330'] },
  { file: '21-90.json', index: 16, id: 'pp21-90-16-gesetzentwurf', title: ABGG_TITLE, drucksache: ['21/6851', '21/6330'] },
  { file: '21-87.json', index: 1, drucksache: ['21/6697', '21/6129', '21/6562'] },
  { file: '21-89.json', index: 2, drucksache: ['21/6979', '21/5874'] },
]

let changed = 0
for (const patch of PATCHES) {
  const path = fileURLToPath(new URL(patch.file, EXTRACTED))
  const data = JSON.parse(await readFile(path, 'utf8'))
  const vote = data.votes.find((v) => v.index === patch.index)
  const next = { ...vote, ...(patch.id ? { id: patch.id } : {}), ...(patch.title ? { title: patch.title } : {}), drucksache: patch.drucksache }
  if (JSON.stringify(next) === JSON.stringify(vote)) continue
  data.votes[data.votes.indexOf(vote)] = next
  await writeFile(path, JSON.stringify(data, null, 2))
  changed++
  console.log(`patched ${patch.file} vote ${patch.index}${patch.id ? ` (pinned ${patch.id})` : ''}`)
}

const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)))
const stale = db.prepare(`
  UPDATE votes SET clean_title = ?
  WHERE id IN ('pp21-90-15-gesetzentwurf', 'pp21-90-16-gesetzentwurf') AND clean_title != ?
`).run(ABGG_TITLE, ABGG_TITLE).changes
const staleTranslations = db.prepare(`
  DELETE FROM vote_translations
  WHERE vote_id IN ('pp21-90-15-gesetzentwurf', 'pp21-90-16-gesetzentwurf') AND title = 'Draft law'
`).run().changes
db.close()

console.log(`extracted patches: ${changed}, clean_title repairs: ${stale}, stale translations purged: ${staleTranslations}`)
