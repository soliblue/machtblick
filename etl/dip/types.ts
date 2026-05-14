export type Fundstelle = {
  id: string
  dokumentnummer: string
  datum: string
  pdf_url?: string
  frage_nummer?: string
  urheber?: string[]
}

export type Urheber = { einbringer: boolean; bezeichnung?: string; titel: string }

export type Ressort = { federfuehrend: boolean; titel: string }

export type Deskriptor = { name: string; typ: string; fundstelle?: boolean }

export type Vorgang = {
  id: string
  vorgangstyp: string
  titel: string
  abstract?: string
  beratungsstand?: string
  wahlperiode: number
  initiative?: string[]
  sachgebiet?: string[]
  deskriptor?: Deskriptor[]
  datum: string
  aktualisiert: string
}

export type Vorgangsposition = {
  id: string
  vorgang_id: string
  vorgangstyp: string
  vorgangsposition: string
  titel: string
  datum: string
  zuordnung?: string
  urheber?: Urheber[]
  fundstelle?: Fundstelle
  ressort?: Ressort[]
  aktivitaet_anzahl?: number
}

export type Aktivitaet = {
  id: string
  aktivitaetsart: string
  person_id?: string | number
  datum?: string
  vorgangsbezug?: { id: string; titel?: string }[]
  fundstelle?: Fundstelle
  titel?: string
  wahlperiode?: number
}

export type Person = {
  id: string
  vorname: string
  nachname: string
  titel?: string
  wahlperiode?: { wahlperiode_nummer: number }[]
}
