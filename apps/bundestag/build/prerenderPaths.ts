import { openDb, partySlugs, publishableAntragIds, publishableVotes, votedMembers } from './shared'

export function prerenderPaths(): string[] {
  const db = openDb()
  const paths = ['/', '/votes/', '/motions/', '/members/', '/parties/', '/speeches/', '/imprint/', '/privacy/', '/methodology/', '/en/', '/en/votes/', '/en/motions/', '/en/members/', '/en/parties/', '/en/speeches/', '/en/imprint/', '/en/privacy/', '/en/methodology/']
  for (const { id } of publishableVotes(db)) {
    paths.push(`/votes/${id}/`)
    paths.push(`/en/votes/${id}/`)
  }
  for (const id of publishableAntragIds(db)) {
    paths.push(`/motions/${id}/`)
  }
  for (const id of publishableAntragIds(db, 'en')) {
    paths.push(`/en/motions/${id}/`)
  }
  for (const { id } of votedMembers(db)) {
    paths.push(`/members/${id}/`)
    paths.push(`/members/${id}/votes/`)
    paths.push(`/members/${id}/speeches/`)
    paths.push(`/en/members/${id}/`)
    paths.push(`/en/members/${id}/votes/`)
    paths.push(`/en/members/${id}/speeches/`)
  }
  for (const slug of partySlugs(db)) {
    paths.push(`/parties/${slug}/`)
    paths.push(`/parties/${slug}/profile/`)
    paths.push(`/parties/${slug}/votes/`)
    paths.push(`/parties/${slug}/history/`)
    paths.push(`/en/parties/${slug}/`)
    paths.push(`/en/parties/${slug}/profile/`)
    paths.push(`/en/parties/${slug}/votes/`)
    paths.push(`/en/parties/${slug}/history/`)
  }
  db.close()
  return paths
}
