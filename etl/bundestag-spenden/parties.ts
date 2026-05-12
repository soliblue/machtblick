const MAP: Record<string, string> = {
  cdu: 'CDU',
  csu: 'CSU',
  spd: 'SPD',
  afd: 'AfD',
  fdp: 'FDP',
  bsw: 'BSW',
  'die linke': 'Die Linke',
  linke: 'Die Linke',
  'bundnis 90/ die grunen': 'B90/Grüne',
  'bundnis 90/die grunen': 'B90/Grüne',
  'die grunen': 'B90/Grüne',
  ssw: 'SSW',
  mlpd: 'MLPD',
  'volt deutschland': 'Volt',
  volt: 'Volt',
  'odp': 'ÖDP',
  'oedp': 'ÖDP',
  'freie wahler': 'Freie Wähler',
  dkp: 'DKP',
  'die gerechtigkeitspartei - team todenhofer': 'Team Todenhöfer',
  'die gerechtigkeitspartei team todenhofer': 'Team Todenhöfer',
}

export function normalizeParty(raw: string) {
  const key = raw
    .replace(/­/g, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
  return MAP[key] ?? null
}
