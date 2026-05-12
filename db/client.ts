import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import * as schema from './schema'

const sqlite = new Database(process.env.MACHTBLICK_DB ?? findDbPath())
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

function findDbPath() {
  const sourceAdjacent = fileURLToPath(new URL('./machtblick.sqlite', import.meta.url))
  if (existsSync(sourceAdjacent)) return sourceAdjacent
  let dir = process.cwd()
  while (true) {
    const candidate = join(dir, 'db', 'machtblick.sqlite')
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) return sourceAdjacent
    dir = parent
  }
}
