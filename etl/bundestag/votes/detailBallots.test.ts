import assert from 'node:assert/strict'
import test from 'node:test'
import { needsXlsxRefresh, parseDetailBallots } from './detailBallots.ts'

test('refreshes XLSX only for marked detail fallbacks', () => {
  assert.equal(needsXlsxRefresh(true, false, true), true)
  assert.equal(needsXlsxRefresh(true, false, false), false)
  assert.equal(needsXlsxRefresh(false, false, true), false)
  assert.equal(needsXlsxRefresh(true, true, true), false)
})

test('parses Bundestag detail ballots', () => {
  assert.deepEqual(parseDetailBallots(`
    <div class="bt-teaser-person-text" data-bundesland="Nordrhein-Westfalen">
      <h3>Abdi, Sanae</h3>
      <p class="bt-person-fraktion">SPD</p>
      <p class="bt-person-abstimmung bt-abstimmung-ja">ja</p>
    </div>
    <div class="bt-teaser-person-text" data-bundesland="Baden-Württemberg">
      <h3>Muster &amp; Sohn, Eva Maria</h3>
      <p class="bt-person-fraktion">fraktionslos</p>
      <p class="bt-person-abstimmung bt-abstimmung-na">nicht abg.</p>
    </div>
  `), [
    { party: 'SPD', state: 'Nordrhein-Westfalen', last: 'Abdi', first: 'Sanae', yes: 1, no: 0, abstain: 0, absent: 0 },
    { party: 'fraktionslos', state: 'Baden-Württemberg', last: 'Muster & Sohn', first: 'Eva Maria', yes: 0, no: 0, abstain: 0, absent: 1 },
  ])
})
