import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'cache', 'answers')

export const ensureRoot = () => {
  if (!existsSync(ROOT)) mkdirSync(ROOT, { recursive: true })
  return ROOT
}

export const pdfPath = (id: number) => join(ROOT, `${id}.pdf`)
export const txtPath = (id: number) => join(ROOT, `${id}.txt`)
export const metaPath = (id: number) => join(ROOT, `${id}.meta.json`)

export const hasPdf = (id: number) => existsSync(pdfPath(id)) && statSync(pdfPath(id)).size > 0
export const hasTxt = (id: number) => existsSync(txtPath(id))
