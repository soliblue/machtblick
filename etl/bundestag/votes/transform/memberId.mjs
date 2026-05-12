const STATE_INITIALS = {
  'Baden-Württemberg': 'BW',
  'Bayern': 'BY',
  'Berlin': 'BE',
  'Brandenburg': 'BB',
  'Bremen': 'HB',
  'Hamburg': 'HH',
  'Hessen': 'HE',
  'Mecklenburg-Vorpommern': 'MV',
  'Niedersachsen': 'NI',
  'Nordrhein-Westfalen': 'NW',
  'Rheinland-Pfalz': 'RP',
  'Saarland': 'SL',
  'Sachsen': 'SN',
  'Sachsen-Anhalt': 'ST',
  'Schleswig-Holstein': 'SH',
  'Thüringen': 'TH',
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function splitName(fullName) {
  const [last, first] = fullName.split(',').map((p) => p.trim())
  return { last, first }
}

function firstToken(first) {
  return first.split(/\s+/)[0]
}

export function buildMemberIdResolver() {
  const baseStates = new Map()
  let collisions = 0
  function resolve(name, state) {
    const { last, first } = splitName(name)
    const base = slugify(`${last}-${firstToken(first)}`)
    const states = baseStates.get(base) ?? new Set()
    const isFirst = states.size === 0 || states.has(state)
    baseStates.set(base, states.add(state))
    if (isFirst) return base
    collisions++
    return `${base}-${STATE_INITIALS[state]}`
  }
  resolve.collisionCount = () => collisions
  return resolve
}
