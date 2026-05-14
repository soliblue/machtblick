const SOFT_HYPHEN = /­/g

const MAP: Record<string, string> = {
  'cdu/csu': 'CDU/CSU',
  'cdu': 'CDU',
  'csu': 'CSU',
  'spd': 'SPD',
  'fdp': 'FDP',
  'afd': 'AfD',
  'die linke': 'Die Linke',
  'die linke. (gruppe)': 'Die Linke',
  'die linke (gruppe)': 'Die Linke',
  'die grunen': 'B90/Grüne',
  'bundnis 90/die grunen': 'B90/Grüne',
  'bsw': 'BSW',
  'bsw (gruppe)': 'BSW',
  'fraktionslos': 'fraktionslos',
}

export function normalizeFractionLabel(label: string): string | null {
  const stripped = label.replace(SOFT_HYPHEN, '').replace(/\s*\(Bundestag[^)]*\)\s*$/, '').trim()
  const key = stripped.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')
  return MAP[key] ?? null
}
