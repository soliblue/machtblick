import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAntragRow, normalizeAntragAbstract } from './buildAntraege.ts'
import type { Vorgang } from './types.ts'

const vorgang: Vorgang = {
  id: '338368',
  vorgangstyp: 'Gesetzgebung',
  titel: 'Frühstartrente',
  abstract: 'Altersvorsorge für Kinder ab dem Geburtsjahrgang 2000',
  wahlperiode: 21,
  datum: '2026-08-14',
  aktualisiert: '2026-08-20T00:00:00+02:00',
}

test('corrects the erroneous DIP birth cohort for motion 338368', () => {
  assert.equal(buildAntragRow(vorgang, [])?.abstract, 'Altersvorsorge für Kinder ab dem Geburtsjahrgang 2020')
})

test('leaves the same source text unchanged on other motions', () => {
  assert.equal(buildAntragRow({ ...vorgang, id: '338369' }, [])?.abstract, vorgang.abstract)
})

test('accepts the corrected DIP cohort and rejects unknown target shapes', () => {
  assert.equal(normalizeAntragAbstract('338368', 'Kinder ab dem Geburtsjahrgang 2020'), 'Kinder ab dem Geburtsjahrgang 2020')
  assert.throws(() => normalizeAntragAbstract('338368', 'Kinder ab dem Geburtsjahrgang 2019'), /unexpected DIP abstract/)
})

test('normalizes decoded DIP title whitespace', () => {
  assert.equal(
    buildAntragRow({
      ...vorgang,
      id: '338869',
      titel:
        ' Vorzeitige Teilrückzahlung Portugals von Krediten des Europäischen Finanzstabilisierungsmechanismus \r\nAntrag auf Einholung eines zustimmenden Beschlusses &amp; Umsetzung ',
    }, [])?.title,
    'Vorzeitige Teilrückzahlung Portugals von Krediten des Europäischen Finanzstabilisierungsmechanismus Antrag auf Einholung eines zustimmenden Beschlusses & Umsetzung',
  )
})
