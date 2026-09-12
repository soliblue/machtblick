import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { getCached, isDocumentsEnvelope } from './proposers.mjs'

test('accepts only DIP document envelopes', () => {
  assert.equal(isDocumentsEnvelope({ numFound: 1, documents: [] }), true)
  assert.equal(isDocumentsEnvelope({ code: 401, message: 'API key required' }), false)
})

test('replaces an invalid cached response with a valid envelope', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'machtblick-proposer-cache-'))
  await writeFile(join(directory, 'd-21-1.json'), JSON.stringify({ code: 401 }))
  const valid = { numFound: 1, documents: [{ dokumentnummer: '21/1' }] }
  const result = await getCached('d-21-1', async () => valid, directory)

  assert.deepEqual(result, valid)
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'd-21-1.json'), 'utf8')), valid)
  await rm(directory, { recursive: true })
})

test('does not cache an invalid fetched response', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'machtblick-proposer-cache-'))

  await assert.rejects(getCached('d-21-2', async () => ({ code: 401 }), directory), /invalid DIP documents response/)
  await assert.rejects(readFile(join(directory, 'd-21-2.json')), /ENOENT/)
  await rm(directory, { recursive: true })
})
