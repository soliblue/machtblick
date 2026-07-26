import Database from 'better-sqlite3'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const BERLIN_DB_PATH = process.env.MACHTBLICK_BERLIN_DB ?? [
  resolve(process.cwd(), 'data/berlin/db/berlin.sqlite'),
  resolve(process.cwd(), '../../data/berlin/db/berlin.sqlite')
].find(existsSync) ?? fileURLToPath(new URL('./berlin.sqlite', import.meta.url))

export function openBerlinDb({ readonly = true, fileMustExist = readonly }: { readonly?: boolean; fileMustExist?: boolean } = {}) {
  const db = new Database(BERLIN_DB_PATH, { readonly, fileMustExist })
  db.pragma('foreign_keys = ON')
  return db
}
