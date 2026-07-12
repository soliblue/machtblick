export function antragVorgangstypToSlug(vt: string): 'antrag' | 'gesetzentwurf' | null {
  if (vt === 'Antrag') return 'antrag'
  if (vt === 'Gesetzgebung') return 'gesetzentwurf'
  return null
}

export function isAntragIntroducingPosition(p: { vorgangsposition: string }) {
  return p.vorgangsposition === 'Antrag'
}

export function isGesetzentwurfPosition(p: { vorgangsposition: string }) {
  return p.vorgangsposition === 'Gesetzentwurf'
}
