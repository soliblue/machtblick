import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import Database from 'better-sqlite3'

test('flags committee returns, court proceedings, and party-prefixed nominations', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'machtblick-procedural-test-'))
  const script = join(directory, 'etl/bundestag/votes/procedural/run.mjs')
  const dbPath = join(directory, 'db/machtblick.sqlite')
  await mkdir(dirname(script), { recursive: true })
  await mkdir(dirname(dbPath), { recursive: true })
  await symlink(new URL('../../../../node_modules', import.meta.url), join(directory, 'node_modules'), 'dir')
  await cp(new URL('./run.mjs', import.meta.url), script)
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE votes (id text PRIMARY KEY, title text NOT NULL, document text, procedural integer NOT NULL);
    INSERT INTO votes VALUES
      ('return', 'Zurückverweisung der Verordnung', '21/5875', 0),
      ('court', 'Stellungnahme im Verfahren 2 BvQ 47/26', '21/6989', 0),
      ('nomination', 'AfD-Wahlvorschlag für den Stiftungsrat', '21/6888', 0),
      ('nominations', 'Grünen-Wahlvorschläge für den Stiftungsrat', '21/6894', 0),
      ('substantive', 'Industrieemissionen senken', '21/5875', 0);
  `)
  db.close()

  const result = spawnSync(process.execPath, [script], { encoding: 'utf8' })
  const readDb = new Database(dbPath, { readonly: true })
  const rows = readDb.prepare('SELECT id, procedural FROM votes ORDER BY id').all()
  readDb.close()

  await rm(directory, { recursive: true })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(rows, [
    { id: 'court', procedural: 1 },
    { id: 'nomination', procedural: 1 },
    { id: 'nominations', procedural: 1 },
    { id: 'return', procedural: 1 },
    { id: 'substantive', procedural: 0 },
  ])
})
