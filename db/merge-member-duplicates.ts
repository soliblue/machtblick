import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))

const HONORIFICS = new Set('dr prof med hc h c dent rer nat phil jur ing mult habil mag lic theol dipl pol'.split(' '))
const PARTICLES = new Set('von van de der den dos da di du le la zu auf freiherr graf edler edle baron baronin'.split(' '))

type Member = { id: string; firstName: string; lastName: string; btMdbId: string | null }

function relaxedKey(first: string, last: string) {
  return `${first} ${last}`
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !HONORIFICS.has(t) && !PARTICLES.has(t))
    .join(' ')
}

function isRealMdbId(id: string | null) {
  return Boolean(id && id.length === 8 && !id.startsWith('0000'))
}

const members = db.prepare('SELECT id, first_name AS firstName, last_name AS lastName, bt_mdb_id AS btMdbId FROM members').all() as Member[]
const voteCounts = new Map((db.prepare('SELECT member_id AS id, COUNT(*) AS n FROM vote_members GROUP BY member_id').all() as Array<{ id: string; n: number }>).map((r) => [r.id, r.n]))
const mandateCounts = new Map((db.prepare('SELECT member_id AS id, COUNT(*) AS n FROM member_mandates GROUP BY member_id').all() as Array<{ id: string; n: number }>).map((r) => [r.id, r.n]))
const awIds = new Set((db.prepare('SELECT member_id AS id FROM member_abgeordnetenwatch').all() as Array<{ id: string }>).map((r) => r.id))
const term21Voters = new Set((db.prepare("SELECT DISTINCT vm.member_id AS id FROM vote_members vm JOIN votes v ON v.id = vm.vote_id WHERE v.term_id = 21").all() as Array<{ id: string }>).map((r) => r.id))

function score(id: string) {
  return (voteCounts.get(id) ?? 0) * 1000 + (awIds.has(id) ? 100 : 0) + (mandateCounts.get(id) ?? 0)
}

const merges = new Map<string, string>()

const byMdbId = new Map<string, Member[]>()
for (const m of members) {
  if (!m.btMdbId) continue
  byMdbId.set(m.btMdbId, [...(byMdbId.get(m.btMdbId) ?? []), m])
}
for (const group of byMdbId.values()) {
  if (group.length < 2) continue
  const canonical = group.reduce((a, b) => (score(b.id) > score(a.id) ? b : a))
  for (const m of group) if (m.id !== canonical.id) merges.set(m.id, canonical.id)
}

const resolve = (id: string) => merges.get(id) ?? id
const byKey = new Map<string, Set<string>>()
for (const m of members) {
  const key = relaxedKey(m.firstName, m.lastName)
  byKey.set(key, (byKey.get(key) ?? new Set()).add(resolve(m.id)))
}
const memberById = new Map(members.map((m) => [m.id, m]))
for (const ids of byKey.values()) {
  const voters = [...ids].filter((id) => term21Voters.has(id) || [...merges.entries()].some(([d, c]) => c === id && term21Voters.has(d)))
  if (voters.length < 2) continue
  const real = voters.filter((id) => isRealMdbId(memberById.get(id)?.btMdbId ?? null))
  if (real.length !== 1) {
    console.warn(`skipping ambiguous term-21 name group: ${voters.join(', ')}`)
    continue
  }
  for (const id of voters) if (id !== real[0]) merges.set(id, real[0])
}

const mergeVoteMembers = db.prepare('UPDATE OR IGNORE vote_members SET member_id = ? WHERE member_id = ?')
const deleteVoteMembers = db.prepare('DELETE FROM vote_members WHERE member_id = ?')
const selectMandates = db.prepare('SELECT id, term_id AS termId, valid_from AS validFrom FROM member_mandates WHERE member_id = ?')
const findMandate = db.prepare('SELECT id FROM member_mandates WHERE member_id = ? AND term_id = ? AND valid_from IS ?')
const fillMandate = db.prepare(`
  UPDATE member_mandates SET
    bt_mdb_id = coalesce(bt_mdb_id, (SELECT bt_mdb_id FROM member_mandates WHERE id = @src)),
    aw_politician_id = coalesce(aw_politician_id, (SELECT aw_politician_id FROM member_mandates WHERE id = @src)),
    aw_mandate_id = coalesce(aw_mandate_id, (SELECT aw_mandate_id FROM member_mandates WHERE id = @src)),
    mandate_type = coalesce(mandate_type, (SELECT mandate_type FROM member_mandates WHERE id = @src)),
    list_state = coalesce(list_state, (SELECT list_state FROM member_mandates WHERE id = @src)),
    constituency_number = coalesce(constituency_number, (SELECT constituency_number FROM member_mandates WHERE id = @src)),
    constituency_name = coalesce(constituency_name, (SELECT constituency_name FROM member_mandates WHERE id = @src))
  WHERE id = @dst
`)
const deleteMandate = db.prepare('DELETE FROM member_mandates WHERE id = ?')
const moveMandate = db.prepare('UPDATE member_mandates SET member_id = ? WHERE id = ?')
const selectAffiliations = db.prepare('SELECT id, term_id AS termId, valid_from AS validFrom FROM member_affiliations WHERE member_id = ?')
const findAffiliation = db.prepare('SELECT id FROM member_affiliations WHERE member_id = ? AND term_id = ? AND valid_from IS ?')
const deleteAffiliation = db.prepare('DELETE FROM member_affiliations WHERE id = ?')
const moveAffiliation = db.prepare('UPDATE member_affiliations SET member_id = ? WHERE id = ?')
const hasAw = db.prepare('SELECT member_id FROM member_abgeordnetenwatch WHERE member_id = ?')
const deleteAw = db.prepare('DELETE FROM member_abgeordnetenwatch WHERE member_id = ?')
const moveAw = db.prepare('UPDATE member_abgeordnetenwatch SET member_id = ? WHERE member_id = ?')
const moveSpeeches = db.prepare('UPDATE speeches SET speaker_member_id = ? WHERE speaker_member_id = ?')
const moveSignatories = db.prepare('UPDATE OR IGNORE antrag_signatories SET member_id = ? WHERE member_id = ?')
const deleteSignatories = db.prepare('DELETE FROM antrag_signatories WHERE member_id = ?')
const fillMember = db.prepare(`
  UPDATE members SET
    bt_mdb_id = coalesce(bt_mdb_id, (SELECT bt_mdb_id FROM members WHERE id = @src)),
    dip_person_id = coalesce(dip_person_id, (SELECT dip_person_id FROM members WHERE id = @src)),
    picture_url = coalesce(picture_url, (SELECT picture_url FROM members WHERE id = @src)),
    picture_author = coalesce(picture_author, (SELECT picture_author FROM members WHERE id = @src)),
    picture_license = coalesce(picture_license, (SELECT picture_license FROM members WHERE id = @src)),
    picture_source_url = coalesce(picture_source_url, (SELECT picture_source_url FROM members WHERE id = @src)),
    mandate_type = coalesce(mandate_type, (SELECT mandate_type FROM members WHERE id = @src)),
    list_state = coalesce(list_state, (SELECT list_state FROM members WHERE id = @src)),
    constituency_number = coalesce(constituency_number, (SELECT constituency_number FROM members WHERE id = @src)),
    constituency_name = coalesce(constituency_name, (SELECT constituency_name FROM members WHERE id = @src))
  WHERE id = @dst
`)
const deleteMember = db.prepare('DELETE FROM members WHERE id = ?')

db.exec('BEGIN')
let ballotsMoved = 0
for (const [dupe, canonical] of merges) {
  const conflictingMdb = memberById.get(dupe)!.btMdbId !== memberById.get(canonical)!.btMdbId && isRealMdbId(memberById.get(dupe)!.btMdbId)
  ballotsMoved += mergeVoteMembers.run(canonical, dupe).changes
  deleteVoteMembers.run(dupe)
  for (const mandate of selectMandates.all(dupe) as Array<{ id: number; termId: number; validFrom: string | null }>) {
    const existing = findMandate.get(canonical, mandate.termId, mandate.validFrom) as { id: number } | undefined
    if (existing) {
      fillMandate.run({ src: mandate.id, dst: existing.id })
      deleteMandate.run(mandate.id)
    } else moveMandate.run(canonical, mandate.id)
  }
  for (const aff of selectAffiliations.all(dupe) as Array<{ id: number; termId: number; validFrom: string | null }>) {
    const existing = findAffiliation.get(canonical, aff.termId, aff.validFrom) as { id: number } | undefined
    if (existing) deleteAffiliation.run(aff.id)
    else moveAffiliation.run(canonical, aff.id)
  }
  if (hasAw.get(canonical)) deleteAw.run(dupe)
  else moveAw.run(canonical, dupe)
  moveSpeeches.run(canonical, dupe)
  moveSignatories.run(canonical, dupe)
  deleteSignatories.run(dupe)
  if (!conflictingMdb) fillMember.run({ src: dupe, dst: canonical })
  deleteMember.run(dupe)
}

const purged = db.prepare(`
  DELETE FROM members WHERE bt_mdb_id IS NULL AND dip_person_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM vote_members x WHERE x.member_id = members.id)
    AND NOT EXISTS (SELECT 1 FROM member_mandates x WHERE x.member_id = members.id)
    AND NOT EXISTS (SELECT 1 FROM member_affiliations x WHERE x.member_id = members.id)
    AND NOT EXISTS (SELECT 1 FROM member_abgeordnetenwatch x WHERE x.member_id = members.id)
    AND NOT EXISTS (SELECT 1 FROM speeches x WHERE x.speaker_member_id = members.id)
    AND NOT EXISTS (SELECT 1 FROM antrag_signatories x WHERE x.member_id = members.id)
`).run().changes

db.exec('COMMIT')
console.log(`merged ${merges.size} duplicate members (${ballotsMoved} ballots reassigned), purged ${purged} unreferenced member rows`)
db.close()
