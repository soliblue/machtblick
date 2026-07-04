type HemicycleSeat = { angle: number; radius: number; row: number }

export function hemicycleSeats(total: number, radii: number[], spread: 'edge' | 'centered' = 'centered'): HemicycleSeat[] {
  const radiusSum = radii.reduce((a, b) => a + b, 0)
  const raw = radii.map((r) => (total * r) / radiusSum)
  const counts = raw.map(Math.floor)
  const byRemainder = radii.map((_, i) => i).sort((a, b) => raw[b] - counts[b] - (raw[a] - counts[a]))
  const missing = total - counts.reduce((a, b) => a + b, 0)
  for (let k = 0; k < missing; k++) counts[byRemainder[k % radii.length]] += 1
  const seats = radii.flatMap((radius, row) =>
    Array.from({ length: counts[row] }, (_, k) => {
      const t = spread === 'centered' ? (k + 0.5) / counts[row] : counts[row] === 1 ? 0.5 : k / (counts[row] - 1)
      return { angle: Math.PI - t * Math.PI, radius, row }
    }),
  )
  return seats.sort((a, b) => b.angle - a.angle || a.row - b.row)
}
