import assert from 'node:assert/strict'
import test from 'node:test'
import { assertAwPublishReady, publishAfterAwReplacementsReady } from './publishReady.ts'

test('invalid current mappings require a collision-free replacement set', () => {
  const invalid = [{ memberId: 'placeholder', awPoliticianId: 1 }]
  assert.throws(() => assertAwPublishReady([], [], invalid, new Set([1])), /replacement not ready/)
  assert.throws(() => assertAwPublishReady(
    [{ memberId: 'canonical', awPoliticianId: 2 }],
    [{ memberId: 'canonical', awPoliticianId: 1 }],
    invalid,
    new Set([1, 2]),
  ), /duplicate AW member mapping/)
  assert.doesNotThrow(() => assertAwPublishReady([], [{ memberId: 'canonical', awPoliticianId: 1 }], invalid, new Set([1])))
  assert.deepEqual(invalid, [{ memberId: 'placeholder', awPoliticianId: 1 }])
})

test('a new unmatched current politician blocks publication', async () => {
  const events: string[] = []
  await assert.rejects(() => publishAfterAwReplacementsReady(
    [1, 2],
    async (id) => {
      events.push(`fetch ${id}`)
      return id === 1 ? { memberId: 'current-member', awPoliticianId: id } : null
    },
    [{ memberId: 'historical-member', awPoliticianId: 99 }],
    [],
    new Set([1, 2]),
    () => events.push('publish'),
  ), /current AW politician 2 not ready/)
  assert.deepEqual(events, ['fetch 1', 'fetch 2'])
})

test('all replacement fetches and validation finish before publishing starts', async () => {
  const failedFetchEvents: string[] = []
  await assert.rejects(() => publishAfterAwReplacementsReady(
    [1, 2],
    async (id) => {
      failedFetchEvents.push(`fetch ${id}`)
      if (id === 2) throw new Error('network failed')
      return { memberId: `member-${id}`, awPoliticianId: id }
    },
    [],
    [],
    new Set([1, 2]),
    () => failedFetchEvents.push('publish'),
  ), /network failed/)
  assert.deepEqual(failedFetchEvents, ['fetch 1', 'fetch 2'])

  const collisionEvents: string[] = []
  await assert.rejects(() => publishAfterAwReplacementsReady(
    [1, 2],
    async (id) => {
      collisionEvents.push(`fetch ${id}`)
      return { memberId: 'same-member', awPoliticianId: id }
    },
    [],
    [],
    new Set([1, 2]),
    () => collisionEvents.push('publish'),
  ), /duplicate AW member mapping/)
  assert.deepEqual(collisionEvents, ['fetch 1', 'fetch 2'])

  const completeEvents: string[] = []
  await publishAfterAwReplacementsReady(
    [1, 2],
    async (id) => {
      completeEvents.push(`fetch ${id}`)
      return { memberId: `member-${id}`, awPoliticianId: id }
    },
    [],
    [],
    new Set([1, 2]),
    () => completeEvents.push('publish'),
  )
  assert.deepEqual(completeEvents, ['fetch 1', 'fetch 2', 'publish'])
})
