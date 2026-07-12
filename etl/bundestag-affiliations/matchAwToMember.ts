function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildAwMatcher(memberIds: Set<string>) {
  const unmatched: string[] = []
  function match(label: string): string | null {
    const parts = label.trim().split(/\s+/)
    const lastSlug = slugify(parts[parts.length - 1])
    const firstSlug = slugify(parts.slice(0, -1).join(' '))
    if (memberIds.has(`${lastSlug}-${firstSlug}`)) return `${lastSlug}-${firstSlug}`
    const firstTokens = firstSlug.split('-').filter(Boolean)
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
