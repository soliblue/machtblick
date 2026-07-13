import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { memberPlaceholderBackground } from './memberPlaceholderBackground'

const COLORS = ['blue', 'purple', 'orange', 'cyan', 'pink', 'teal', 'indigo', 'rust']

test('maps the iOS palette order with the member ID byte hash', () => {
  const expected = [
    ['h', 'blue'],
    ['a', 'purple'],
    ['b', 'orange'],
    ['c', 'cyan'],
    ['d', 'pink'],
    ['e', 'teal'],
    ['f', 'indigo'],
    ['g', 'rust'],
  ]

  for (const [memberId, color] of expected) {
    assert.equal(memberPlaceholderBackground(memberId), `member-placeholder-${color}`)
  }
})

test('hashes non-ASCII member IDs as UTF-8 bytes', () => {
  assert.equal(
    memberPlaceholderBackground('ä'),
    'member-placeholder-purple',
  )
})

test('keeps known member mappings stable', () => {
  assert.equal(
    memberPlaceholderBackground('aeikens-anna'),
    'member-placeholder-purple',
  )
  assert.equal(
    memberPlaceholderBackground('vollath-sarah'),
    'member-placeholder-orange',
  )
})

test('defines every placeholder class with the exact accent mix', () => {
  const css = readFileSync(new URL('../../styles/globals.css', import.meta.url), 'utf8')
  assert.ok(css.includes(`.member-placeholder {
  background: color-mix(in oklab, var(--member-placeholder-accent) 60%, var(--color-background) 40%);
}`))
  for (const color of COLORS) {
    assert.ok(css.includes(`.member-placeholder-${color} { --member-placeholder-accent: var(--color-${color}); }`))
  }
})
