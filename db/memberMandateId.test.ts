import assert from 'node:assert/strict'
import test from 'node:test'
import { memberMandateIdAction } from './memberMandateId.ts'

test('selects term-21 mandate ids that differ from canonical Stammdaten ids', () => {
  assert.equal(memberMandateIdAction({
    termId: 21,
    mandateBtMdbId: '00001673',
    memberBtMdbId: '11004056',
  }), 'normalize')
  assert.equal(memberMandateIdAction({
    termId: 21,
    mandateBtMdbId: null,
    memberBtMdbId: '11004317',
  }), 'normalize')
  assert.equal(memberMandateIdAction({
    termId: 21,
    mandateBtMdbId: '11003821',
    memberBtMdbId: '11003821',
  }), 'keep')
})

test('fails closed on a conflicting nonlegacy mandate id', () => {
  assert.equal(memberMandateIdAction({
    termId: 21,
    mandateBtMdbId: '11009999',
    memberBtMdbId: '11004056',
  }), 'conflict')
})

test('leaves historical terms and noncanonical authoritative ids unchanged', () => {
  for (const row of [
    { termId: 20, mandateBtMdbId: '00001673', memberBtMdbId: '11004056' },
    { termId: 21, mandateBtMdbId: null, memberBtMdbId: '00001673' },
    { termId: 21, mandateBtMdbId: null, memberBtMdbId: '1104056' },
    { termId: 21, mandateBtMdbId: null, memberBtMdbId: '1100405x' },
    { termId: 21, mandateBtMdbId: null, memberBtMdbId: null },
  ]) assert.equal(memberMandateIdAction(row), 'keep')
})
