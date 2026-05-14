export function vorgangstypToSlug(vt: string): 'kleine' | 'grosse' | 'schriftlich' | null {
  if (vt === 'Kleine Anfrage') return 'kleine'
  if (vt === 'Große Anfrage') return 'grosse'
  if (vt === 'Schriftliche Frage') return 'schriftlich'
  return null
}

export function antragVorgangstypToSlug(vt: string): 'antrag' | 'gesetzentwurf' | null {
  if (vt === 'Antrag') return 'antrag'
  if (vt === 'Gesetzgebung') return 'gesetzentwurf'
  return null
}

export function isQuestionPosition(p: { vorgangsposition: string }) {
  const v = p.vorgangsposition
  return v === 'Kleine Anfrage' || v === 'Große Anfrage' || v === 'Schriftliche Frage/Schriftliche Antwort'
}

export function isAnswerPosition(p: { vorgangsposition: string }) {
  return p.vorgangsposition === 'Antwort' || p.vorgangsposition === 'Schriftliche Frage/Schriftliche Antwort'
}

export function isAntragIntroducingPosition(p: { vorgangsposition: string }) {
  return p.vorgangsposition === 'Antrag'
}

export function isGesetzentwurfPosition(p: { vorgangsposition: string; zuordnung?: string }) {
  return p.vorgangsposition === 'Gesetzentwurf'
}
