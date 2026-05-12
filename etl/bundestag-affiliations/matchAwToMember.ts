function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function splitAwLabel(label: string) {
  const parts = label.trim().split(/\s+/)
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] }
}

export function buildAwMatcher(memberIds: Set<string>) {
  const matched = new Map<string, string>()
  const unmatched: string[] = []
  function match(label: string): string | null {
    const { firstName, lastName } = splitAwLabel(label)
    const lastSlug = slugify(lastName)
    const firstSlug = slugify(firstName)
    const direct = `${lastSlug}-${firstSlug}`
    if (memberIds.has(direct)) {
      matched.set(label, direct)
      return direct
    }
    const firstTokens = firstSlug.split('-').filter(Boolean)
    const candidates = [...memberIds].filter((id) => id.startsWith(`${lastSlug}-`))
    const scored = candidates
      .map((id) => {
        const rest = id.slice(lastSlug.length + 1).split('-')
        const overlap = firstTokens.filter((t) => rest.includes(t)).length
        return { id, overlap }
      })
      .sort((a, b) => b.overlap - a.overlap)
    if (scored[0] && scored[0].overlap > 0) {
      matched.set(label, scored[0].id)
      return scored[0].id
    }
    unmatched.push(label)
    return null
  }
  match.unmatched = () => unmatched
  return match
}
