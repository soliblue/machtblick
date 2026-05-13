type Row = { label: string; title: string; url: string }
type Kind = 'antrag' | 'petitionen' | 'wahleinspruch' | 'verordnung'
type Picked = { drucksacheId: string; pdfUrl: string; kind: Kind } | null

export function pickAntragFromRows(rows: Row[]): Picked
export function pickAntrag(voteId: string, db: unknown): Picked
export function pickAntragWithFallback(voteId: string, db: unknown): Promise<Picked>
