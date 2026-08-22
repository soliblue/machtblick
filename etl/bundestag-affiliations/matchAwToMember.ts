function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildAwMatcher(memberIds: Set<string>, preferredIds = new Set<string>(), memberByAwPoliticianId = new Map<number, string>()) {
  const unmatched: string[] = []
  function match(label: string, awPoliticianId?: number): string | null {
    const parts = label.trim().split(/\s+/)
    const lastSlug = slugify(parts[parts.length - 1])
    const firstSlug = slugify(parts.slice(0, -1).join(' '))
    const exact = `${lastSlug}-${firstSlug}`
    const awMember = awPoliticianId ? memberByAwPoliticianId.get(awPoliticianId) : undefined
    if (awMember && preferredIds.has(awMember)) return awMember
    if (memberIds.has(exact) && preferredIds.has(exact)) return exact
    const firstTokens = firstSlug.split('-').filter(Boolean)
    const preferred = [...preferredIds]
      .filter((id) => id.startsWith(`${lastSlug}-`))
      .map((id) => ({ id, overlap: firstTokens.filter((t) => id.slice(lastSlug.length + 1).split('-').includes(t)).length }))
      .sort((a, b) => b.overlap - a.overlap)[0]
    if (preferred && preferred.overlap > 0) return preferred.id
    if (awMember) return awMember
    if (memberIds.has(exact)) return exact
    const best = [...memberIds]
      .filter((id) => id.startsWith(`${lastSlug}-`))
      .map((id) => ({ id, overlap: firstTokens.filter((t) => id.slice(lastSlug.length + 1).split('-').includes(t)).length }))
      .sort((a, b) => b.overlap - a.overlap)[0]
    if (best && best.overlap > 0) return best.id
    unmatched.push(label)
    return null
  }
  match.unmatched = () => unmatched
  return match
}
