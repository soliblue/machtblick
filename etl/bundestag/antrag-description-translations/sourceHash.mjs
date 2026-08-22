import { createHash } from 'node:crypto'

export function antragDescriptionSourceHash(summarySimplified, summaryDetail) {
  return createHash('sha256').update(JSON.stringify({ summarySimplified, summaryDetail })).digest('hex')
}
