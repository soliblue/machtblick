const BUNDESLAENDER = new Set([
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
])

export const isLaenderInitiative = (value: string | null) => {
  const parts = (value ?? '').split(',').map((part) => part.trim()).filter(Boolean)
  return parts.length > 0 && parts.every((part) => BUNDESLAENDER.has(part))
}
