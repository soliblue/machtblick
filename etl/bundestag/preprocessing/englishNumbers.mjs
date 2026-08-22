const GERMAN_NUMBER = /(?<![\d.,])(?:\d{1,3}(?:[.\u00a0 ]\d{3})+(?:,\d+)?|\d+,\d+)(?![\d.,])/g
const ENGLISH_NUMBER = /(?<![\d.,])(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?![\d.,])/g

export function assertEnglishNumberFormatting(source, translation) {
  const actual = [...translation.matchAll(ENGLISH_NUMBER)].map((match) => match[0])
  const forbiddenTokens = new Set()
  for (const match of source.matchAll(GERMAN_NUMBER)) {
    const [whole, fraction] = match[0].split(',')
    const digits = whole.replace(/[.\u00a0 ]/g, '')
    const integer = /[.\u00a0 ]/.test(whole) ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : digits
    const expected = fraction === undefined ? integer : `${integer}.${fraction}`
    const index = actual.indexOf(expected)
    if (index === -1) throw new Error(`English translation must contain ${expected} for German number ${match[0]}`)
    actual.splice(index, 1)
    if (match[0] !== expected) forbiddenTokens.add(match[0])
    if (digits.length > 3) {
      forbiddenTokens.add(`${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${fraction === undefined ? '' : `,${fraction}`}`)
      forbiddenTokens.add(`${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${fraction === undefined ? '' : `,${fraction}`}`)
    }
  }
  for (const token of forbiddenTokens) {
    if (new RegExp(`(?<![\\d.,])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\d.,])`).test(translation)) throw new Error(`English translation retains German number ${token}`)
  }
}
