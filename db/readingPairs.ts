export function readingStage(title: string): 'second' | 'third' | 'final' | null {
  const value = normalizeText(title)
  if (value.includes('zweite beratung') || value.includes('2 beratung')) return 'second'
  if (value.includes('dritte beratung') || value.includes('3 beratung')) return 'third'
  if (value.includes('schlussabstimmung')) return 'final'
  return null
}

export function stemKey(title: string) {
  return normalizeText(stripStage(title))
}

export function isGenericStem(key: string) {
  return key.length < 8
    || key === 'gesetz'
    || key === 'gesetzentwurf'
    || key === 'schlussabstimmung'
    || key === 'dritte beratung'
    || key === 'dritte beratung und schlussabstimmung'
}

export function stripStage(value: string) {
  return value
    .replace(/\s*\((?:zweite|dritte|2\.|3\.)\s+Beratung(?:,\s*Schlussabstimmung)?\)/gi, '')
    .replace(/\s*\((?:second|third)\s+reading(?:,\s*final vote)?\)/gi, '')
    .replace(/\s*\((?:Schlussabstimmung|final vote)\)/gi, '')
    .replace(/^Schlussabstimmung:\s*/i, '')
    .replace(/^Dritte Beratung(?: und Schlussabstimmung)?(?: des| der| zum| zu dem)?\s*/i, '')
    .replace(/^Zweite Beratung(?: des| der| zum| zu dem)?\s*/i, '')
    .replace(/[:\s-]+(?:zweite|dritte|2\.|3\.)\s+Beratung(?:\s+und\s+Schlussabstimmung)?$/i, '')
    .replace(/[:\s-]+Schlussabstimmung$/i, '')
    .trim()
}

export function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim()
}
