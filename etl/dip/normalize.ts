export function vorgangstypToSlug(vt: string): 'kleine' | 'grosse' | 'schriftlich' | null {
  if (vt === 'Kleine Anfrage') return 'kleine'
  if (vt === 'Große Anfrage') return 'grosse'
  if (vt === 'Schriftliche Frage') return 'schriftlich'
  return null
}

export function isQuestionPosition(p: { vorgangsposition: string }) {
  const v = p.vorgangsposition
  return v === 'Kleine Anfrage' || v === 'Große Anfrage' || v === 'Schriftliche Frage/Schriftliche Antwort'
}

export function isAnswerPosition(p: { vorgangsposition: string }) {
  return p.vorgangsposition === 'Antwort' || p.vorgangsposition === 'Schriftliche Frage/Schriftliche Antwort'
}
