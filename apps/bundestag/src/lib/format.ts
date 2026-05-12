export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function pct(n: number) {
  return `${Math.round(n * 100)}%`
}
