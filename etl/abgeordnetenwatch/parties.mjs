const PARTY_DEFS = {
  cdu: { name: 'Christlich Demokratische Union', shortName: 'CDU', color: '#1c2a3a' },
  csu: { name: 'Christlich-Soziale Union', shortName: 'CSU', color: '#0088c9' },
  spd: { name: 'Sozialdemokratische Partei Deutschlands', shortName: 'SPD', color: '#e3000f' },
  gruene: { name: 'BÜNDNIS 90/DIE GRÜNEN', shortName: 'Grüne', color: '#1aa037' },
  afd: { name: 'Alternative für Deutschland', shortName: 'AfD', color: '#009ee0' },
  linke: { name: 'Die Linke', shortName: 'Linke', color: '#be3075' },
  fdp: { name: 'Freie Demokratische Partei', shortName: 'FDP', color: '#ffcc00' },
  'freie-waehler': { name: 'FREIE WÄHLER', shortName: 'Freie Wähler', color: '#f39200' },
  bsw: { name: 'Bündnis Sahra Wagenknecht', shortName: 'BSW', color: '#7d254f' },
  fraktionslos: { name: 'Fraktionslos', shortName: 'Fraktionslos', color: '#7a7a7a' },
}

const LABEL_TO_SLUG = {
  CDU: 'cdu',
  CSU: 'csu',
  SPD: 'spd',
  'BÜNDNIS 90/DIE GRÜNEN': 'gruene',
  'DIE GRÜNEN': 'gruene',
  GRÜNE: 'gruene',
  AFD: 'afd',
  'DIE LINKE': 'linke',
  'FREIE WÄHLER': 'freie-waehler',
  FDP: 'fdp',
  BSW: 'bsw',
  FRAKTIONSLOS: 'fraktionslos',
}

const cleanLabel = (label) =>
  label
    .replace(/­/g, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()

export function fractionSlug(label) {
  if (typeof label !== 'string') return null
  const clean = cleanLabel(label)
  return LABEL_TO_SLUG[clean] ?? LABEL_TO_SLUG[clean.toUpperCase()] ?? null
}

export function partyDef(slug) {
  return PARTY_DEFS[slug]
}
