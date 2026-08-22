import assert from 'node:assert/strict'
import test from 'node:test'
import { assertEnglishNumberFormatting } from './englishNumbers.mjs'

test('rejects German thousands punctuation in English', () => {
  assert.throws(() => assertEnglishNumberFormatting('265.000 Euro', '265.000 euros'))
  assert.doesNotThrow(() => assertEnglishNumberFormatting('265.000 Euro', '265,000 euros'))
})

test('rejects extra German punctuation after the correct value', () => {
  assert.throws(
    () => assertEnglishNumberFormatting('265.000 Euro', '265,000 euros, not 265.000 euros'),
    /retains German number 265.000/,
  )
  assert.throws(
    () => assertEnglishNumberFormatting('2,808 Mio. Euro', '2.808 million euros, not 2,808 million euros'),
    /retains German number 2,808/,
  )
})

test('preserves German decimal values with English punctuation', () => {
  assert.doesNotThrow(() => assertEnglishNumberFormatting('1,186 Milliarden Euro', '1.186 billion euros'))
  assert.throws(() => assertEnglishNumberFormatting('1,186 Milliarden Euro', '1,186 billion euros'))
  assert.doesNotThrow(() => assertEnglishNumberFormatting('2,808 Mio. Euro', '2.808 million euros'))
})

test('converts spaced thousands and decimal commas without changing units', () => {
  assert.doesNotThrow(() => assertEnglishNumberFormatting('290 882,5 Tsd. Euro', '290,882.5 thousand euros'))
})

test('ignores dotted dates and consumes repeated values as a multiset', () => {
  assert.doesNotThrow(() => assertEnglishNumberFormatting('am 31.12.2025', 'on 31.12.2025'))
  assert.throws(() => assertEnglishNumberFormatting('265.000 und 265.000 Euro', '265,000 and 265.000 euros'))
})
