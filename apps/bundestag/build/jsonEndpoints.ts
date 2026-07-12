import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { fullAntrag, leanMotions } from '../vite-data/antraege'
import { leanMembers, fullMember, loadMemberBuildData } from '../vite-data/members'
import { leanParties, fullParty } from '../vite-data/parties'
import { writeSpeechesStatic } from '../vite-data/speeches'
import type { Locale } from '../src/lib/locale'
import { loadStaticTranslations } from '../vite-data/translations'
import { leanVotes, fullVote, loadVoteBuildData } from '../vite-data/votes'
import { openDb, partySlugs, publishableAntragIds, publishableVotes, votedMembers } from './shared'

function writeDir(dir: string, files: Array<[string, () => unknown]>) {
  mkdirSync(dir, { recursive: true })
  for (const [name, data] of files) writeFileSync(`${dir}/${name}`, JSON.stringify(data()))
  const written = new Set(files.map(([name]) => name))
  for (const stale of readdirSync(dir).filter((name) => !written.has(name))) {
    rmSync(`${dir}/${stale}`, { force: true, recursive: true })
  }
}

export function writeJsonEndpoints() {
  const db = openDb()
  const publicDir = fileURLToPath(new URL('../public', import.meta.url))
  const translations = loadStaticTranslations(db)
  const voteData = loadVoteBuildData(db, translations)
  const memberData = loadMemberBuildData(db, translations)
  const voteIds = publishableVotes(db).map((v) => v.id)
  const memberIds = votedMembers(db).map((m) => m.id)
  const slugs = partySlugs(db)
  rmSync(`${publicDir}/antraege`, { force: true, recursive: true })
  rmSync(`${publicDir}/en/antraege`, { force: true, recursive: true })
  for (const locale of ['de', 'en'] satisfies Locale[]) {
    const prefix = locale === 'en' ? '/en' : ''
    writeDir(`${publicDir}${prefix}/api`, [
      ['votes.json', () => leanVotes(db, locale, voteData)],
      ['members.json', () => leanMembers(db, memberData)],
      ['parties.json', () => leanParties(db)],
      ['motions.json', () => leanMotions(db, locale, translations)],
    ])
    writeDir(`${publicDir}${prefix}/votes`, voteIds.map((id): [string, () => unknown] => [`${id}.json`, () => fullVote(db, id, locale, voteData)]))
    writeDir(`${publicDir}${prefix}/motions`, publishableAntragIds(db).map((id): [string, () => unknown] => [`${id}.json`, () => fullAntrag(db, id, locale, translations)]))
    writeDir(`${publicDir}${prefix}/members`, memberIds.map((id): [string, () => unknown] => [`${id}.json`, () => {
      const detail = fullMember(db, id, locale, memberData)
      return { ...detail, history: detail.history.map((row) => ({ ...row, partyMajority: row.partyMajority ?? '' })) }
    }]))
    mkdirSync(`${publicDir}${prefix}/parties`, { recursive: true })
    for (const slug of slugs) {
      writeFileSync(`${publicDir}${prefix}/parties/${slug}.json`, JSON.stringify(fullParty(db, slug, locale, translations)))
    }
  }
  writeSpeechesStatic(db, publicDir, translations)
  db.close()
}
