import assert from 'node:assert/strict'
import test from 'node:test'
import { dipList } from '../../dip/client.ts'
import { protocolDocuments, protocolXml } from './fetch.mjs'
import { hasProtocolText } from './protocolSource.mjs'

const protocol94 = {
  id: '5811',
  dokumentart: 'Plenarprotokoll',
  typ: 'Dokument',
  dokumentnummer: '21/94',
  wahlperiode: 21,
  herausgeber: 'BT',
  datum: '2026-09-11',
}

test('skips an advertised protocol without published text', () => {
  assert.equal(protocolXml(protocol94, protocol94), null)
})

test('serializes a complete protocol for the existing pipeline', () => {
  const xml = protocolXml({
    ...protocol94,
    id: '5810',
    dokumentnummer: '21/93',
    datum: '2026-09-10',
    fundstelle: { urheber: ['Bundestag', 'Bundesrat'] },
    text: 'Plenarprotokoll & Abstimmung <vollständig>',
  }, { ...protocol94, id: '5810', dokumentnummer: '21/93' })

  assert.equal(hasProtocolText(xml), true)
  assert.match(xml, /<dokumentnummer>21\/93<\/dokumentnummer>/)
  assert.match(xml, /<text>Plenarprotokoll &amp; Abstimmung &lt;vollständig&gt;<\/text>/)
  assert.equal(xml.match(/<urheber>/g)?.length, 2)
})

test('rejects API and authentication error envelopes', () => {
  assert.throws(() => protocolDocuments({ code: 401, message: 'API key required' }), /invalid DIP protocol list response/)
  assert.throws(() => protocolXml({ code: 401, message: 'API key required' }, protocol94), /invalid DIP protocol detail/)
  assert.throws(() => protocolXml({ error: 'upstream unavailable' }, protocol94), /invalid DIP protocol detail/)
})

test('rejects a valid protocol record that does not match the advertised record', () => {
  assert.throws(
    () => protocolXml({ ...protocol94, id: '5810', dokumentnummer: '21/93' }, protocol94),
    /invalid DIP protocol detail for 21\/94/,
  )
})

test('accepts only canonical Bundestag protocol lists', () => {
  assert.deepEqual(protocolDocuments({ numFound: 94, documents: [protocol94] }), [protocol94])
  assert.throws(
    () => protocolDocuments({ numFound: 94, documents: [{ ...protocol94, herausgeber: 'BR' }] }),
    /invalid DIP protocol list response/,
  )
  assert.throws(
    () => protocolDocuments({ numFound: 0, documents: [protocol94] }),
    /invalid DIP protocol list response/,
  )
})

test('rejects JSON HTTP errors in the shared DIP client', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{"code":401,"message":"API key required"}', { status: 401 }))
  await assert.rejects(
    dipList('/plenarprotokoll-text/5811', { format: 'json' }),
    /DIP HTTP 401: \/plenarprotokoll-text\/5811/,
  )
})
