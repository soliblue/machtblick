import assert from 'node:assert/strict'
import test from 'node:test'
import { hasProtocolText } from './protocolSource.mjs'

test('rejects metadata-only protocol XML', () => {
  assert.equal(hasProtocolText('<document><dokumentnummer>21/90</dokumentnummer></document>'), false)
})

test('accepts protocol XML with text', () => {
  assert.equal(hasProtocolText('<document><text><![CDATA[Plenarprotokoll]]></text></document>'), true)
})
