import { createHash } from 'node:crypto'

export function antragTitleSourceHash(type, title, summary) {
  return createHash('sha256').update(JSON.stringify({ type, title, summary })).digest('hex')
}
