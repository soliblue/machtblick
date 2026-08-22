import { createHash } from 'node:crypto'

export function antragTitleTranslationSourceHash(title, cleanTitle) {
  return createHash('sha256').update(JSON.stringify({ title, cleanTitle })).digest('hex')
}
