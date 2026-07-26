import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { openBerlinDb } from '@machtblick/berlin-db/client'
import type {
  BerlinCandidate,
  BerlinCandidateProfileInput,
  BerlinCandidacyInput,
  BerlinProgrammeInput,
  BerlinSourceKind
} from '@machtblick/berlin-db/types'
import { candidates, parties } from './catalog'
import { validateCandidatePortraits } from './portraits'

const readJson = (url: URL): unknown => existsSync(fileURLToPath(url))
  ? JSON.parse(readFileSync(url, 'utf8'))
  : []
const sourceIdFor = (kind: BerlinSourceKind, url: string) => createHash('sha256').update(`${kind}|${url}`).digest('hex').slice(0, 24)
const recordIdFor = (...values: (string | number | null)[]) => createHash('sha256').update(JSON.stringify(values)).digest('hex').slice(0, 24)

const candidateProfiles = readJson(new URL('../../../research/berlin-2026/candidate-profiles.json', import.meta.url)) as BerlinCandidateProfileInput[]
const programmeContent = readJson(new URL('../../../research/berlin-2026/programmes.json', import.meta.url)) as BerlinProgrammeInput[]
const candidatePortraitRecords = readJson(new URL('../../../research/berlin-2026/candidate-portraits.json', import.meta.url))
const partyBySlug = new Map(parties.map((party) => [party.slug, party]))
const programmeByPartySlug = new Map(programmeContent.map((programme) => [programme.partySlug, programme]))
const profileBySlug = new Map(candidateProfiles.map((profile) => [profile.slug, profile]))
const candidateBySlug = new Map(candidates.map((candidate) => [candidate.slug, candidate]))

for (const profile of candidateProfiles) {
  const candidate = candidateBySlug.get(profile.slug)
  const party = partyBySlug.get(profile.partySlug)!
  const candidacy = profile.candidacies?.[0]
  candidateBySlug.set(profile.slug, {
    slug: profile.slug,
    name: profile.name,
    partySlug: profile.partySlug,
    partyShortName: party.shortName,
    partyColor: party.color,
    candidacyType: candidate?.candidacyType ?? candidacy?.type ?? (profile.constituency ? 'wahlkreis' : party.listType),
    listPosition: candidate ? candidate.listPosition : candidacy?.listPosition ?? null,
    district: candidate ? candidate.district : candidacy ? candidacy.district ?? null : profile.district ?? null,
    constituency: candidate ? candidate.constituency : candidacy ? candidacy.constituency ?? null : profile.constituency ?? null,
    sourceStatus: candidate?.sourceStatus ?? 'party_published',
    sourceUrl: candidate?.sourceUrl ?? profile.sourceUrl
  })
}

const candidatePortraits = validateCandidatePortraits(candidatePortraitRecords, new Set(candidateBySlug.keys()))
const portraitBySlug = new Map(candidatePortraits.map((portrait) => [portrait.candidateSlug, portrait]))
const db = openBerlinDb({ readonly: false })
const insertParty = db.prepare(`
  INSERT INTO parties (
    slug, name, short_name, list_type, list_scope, programme_status,
    programme_url, candidate_coverage, candidate_url, color
  ) VALUES (
    @slug, @name, @shortName, @listType, @listScope, @programmeStatus,
    @programmeUrl, @candidateCoverage, @candidateUrl, @color
  )
`)
const insertCandidate = db.prepare(`
  INSERT INTO candidates (
    slug, name, party_slug, candidacy_type, list_position,
    district, constituency, source_status, source_url
  ) VALUES (
    @slug, @name, @partySlug, @candidacyType, @listPosition,
    @district, @constituency, @sourceStatus, @sourceUrl
  )
`)
const insertSource = db.prepare(`
  INSERT OR IGNORE INTO sources (
    id, kind, url, title, publisher, publication_date, retrieved_at
  ) VALUES (
    @id, @kind, @url, @title, @publisher, @publicationDate, @retrievedAt
  )
`)
const insertCandidacy = db.prepare(`
  INSERT INTO candidate_candidacies (
    id, candidate_slug, candidacy_type, list_position, district, constituency, source_id
  ) VALUES (
    @id, @candidateSlug, @type, @listPosition, @district, @constituency, @sourceId
  )
`)
const insertProfile = db.prepare(`
  INSERT INTO candidate_profiles (
    candidate_slug, occupation, birth_year, biography_summary,
    priorities_json, source_id, retrieved_at
  ) VALUES (
    @candidateSlug, @occupation, @birthYear, @biographySummary,
    @prioritiesJson, @sourceId, @retrievedAt
  )
`)
const insertPortrait = db.prepare(`
  INSERT INTO candidate_portraits (
    candidate_slug, image_url, author, license, license_url, status,
    provenance, source_id, retrieved_at
  ) VALUES (
    @candidateSlug, @imageUrl, @author, @license, @licenseUrl, @status,
    @provenance, @sourceId, @retrievedAt
  )
`)
const insertLink = db.prepare(`
  INSERT INTO candidate_links (
    id, candidate_slug, kind, label, url, source_id
  ) VALUES (
    @id, @candidateSlug, @kind, @label, @url, @sourceId
  )
`)
const insertProgramme = db.prepare(`
  INSERT INTO programmes (
    party_slug, status, title, publication_date, summary, source_id, retrieved_at
  ) VALUES (
    @partySlug, @status, @title, @publicationDate, @summary, @sourceId, @retrievedAt
  )
`)
const insertTopic = db.prepare(`
  INSERT INTO programme_topics (
    party_slug, slug, title, summary, positions_json, source_id, sort_order
  ) VALUES (
    @partySlug, @slug, @title, @summary, @positionsJson, @sourceId, @sortOrder
  )
`)
const insertTopicCategory = db.prepare(`
  INSERT INTO programme_topic_categories (
    party_slug, topic_slug, category, sort_order
  ) VALUES (
    @partySlug, @topicSlug, @category, @sortOrder
  )
`)
const insertDocument = db.prepare(`
  INSERT INTO programme_documents (
    id, party_slug, format, kind, embeddable, source_id, sort_order
  ) VALUES (
    @id, @partySlug, @format, @kind, @embeddable, @sourceId, @sortOrder
  )
`)
const insertMetadata = db.prepare('INSERT INTO metadata (key, value) VALUES (?, ?)')
const addSource = (
  kind: BerlinSourceKind,
  url: string,
  title: string,
  publisher: string,
  publicationDate: string | null,
  retrievedAt: string
) => {
  const id = sourceIdFor(kind, url)
  insertSource.run({ id, kind, url, title, publisher, publicationDate, retrievedAt })
  return id
}

db.transaction(() => {
  db.exec(`
    DELETE FROM programme_documents;
    DELETE FROM programme_topic_categories;
    DELETE FROM programme_topics;
    DELETE FROM programmes;
    DELETE FROM candidate_links;
    DELETE FROM candidate_portraits;
    DELETE FROM candidate_profiles;
    DELETE FROM candidate_candidacies;
    DELETE FROM candidates;
    DELETE FROM sources;
    DELETE FROM parties;
    DELETE FROM metadata;
  `)
  for (const party of parties) {
    const programme = programmeByPartySlug.get(party.slug)
    insertParty.run({
      ...party,
      programmeStatus: programme?.status ?? party.programmeStatus,
      programmeUrl: programme?.sourceUrl ?? party.programmeUrl
    })
  }

  addSource(
    'admission',
    'https://www.berlin.de/wahlen/pressemitteilungen/2026/pressemitteilung.1697177.php',
    'Zulassung der Wahlvorschläge',
    'Die Landeswahlleiterin für Berlin',
    '2026-07-24',
    '2026-07-25'
  )
  addSource(
    'official_candidate_publication',
    'https://www.berlin.de/wahlen/wahlen/berliner-wahlen-2026/wahlvorschlaege/artikel.1600254.php',
    'Wahlvorschläge zur Berlin-Wahl 2026',
    'Die Landeswahlleiterin für Berlin',
    null,
    '2026-07-25'
  )

  for (const candidate of candidateBySlug.values()) {
    insertCandidate.run(candidate)
    const party = partyBySlug.get(candidate.partySlug)!
    const profile = profileBySlug.get(candidate.slug)
    const candidacies = new Map<string, BerlinCandidacyInput>()
    const addCandidacy = (candidacy: BerlinCandidacyInput) => candidacies.set(
      JSON.stringify([candidacy.type, candidacy.listPosition ?? null, candidacy.district ?? null, candidacy.constituency ?? null]),
      candidacy
    )
    addCandidacy({
      type: candidate.candidacyType,
      listPosition: candidate.listPosition,
      district: candidate.district,
      constituency: candidate.constituency,
      sourceUrl: candidate.sourceUrl
    })
    for (const candidacy of profile?.candidacies ?? []) addCandidacy(candidacy)
    if (profile?.constituency && !(profile.candidacies ?? []).some(({ type, constituency }) => type === 'wahlkreis' && constituency === profile.constituency)) {
      addCandidacy({
        type: 'wahlkreis',
        district: profile.district ?? null,
        constituency: profile.constituency,
        sourceUrl: profile.sourceUrl
      })
    }
    for (const candidacy of candidacies.values()) {
      const sourceId = addSource(
        'candidate_list',
        candidacy.sourceUrl,
        `${party.shortName}: ${candidacy.type === 'wahlkreis' ? 'Direktkandidaturen' : candidacy.type === 'bezirksliste' ? 'Bezirkslisten' : 'Landesliste'}`,
        party.name,
        null,
        profile?.retrievedAt ?? '2026-07-25'
      )
      insertCandidacy.run({
        id: recordIdFor(candidate.slug, candidacy.type, candidacy.listPosition ?? null, candidacy.district ?? null, candidacy.constituency ?? null),
        candidateSlug: candidate.slug,
        type: candidacy.type,
        listPosition: candidacy.listPosition ?? null,
        district: candidacy.district ?? null,
        constituency: candidacy.constituency ?? null,
        sourceId
      })
    }
    if (profile) {
      const sourceId = addSource(
        'candidate_profile',
        profile.profileUrl ?? profile.sourceUrl,
        profile.profileUrl ? `${party.shortName}: Profil von ${profile.name}` : `${party.shortName}: Kandidierendenprofile`,
        party.name,
        null,
        profile.retrievedAt
      )
      insertProfile.run({
        candidateSlug: candidate.slug,
        occupation: profile.occupation ?? null,
        birthYear: profile.birthYear ?? null,
        biographySummary: profile.biographySummary ?? null,
        prioritiesJson: JSON.stringify(profile.priorities ?? []),
        sourceId,
        retrievedAt: profile.retrievedAt
      })
      const links = [
        ...(profile.profileUrl ? [{ kind: 'profile', label: 'Kandidierendenprofil', url: profile.profileUrl }] : []),
        ...(profile.website ? [{ kind: 'website', label: 'Website', url: profile.website }] : []),
        ...(profile.email ? [{ kind: 'email', label: 'E-Mail', url: profile.email.startsWith('mailto:') ? profile.email : `mailto:${profile.email}` }] : []),
        ...Object.entries(profile.socialLinks ?? {}).map(([kind, url]) => ({
          kind,
          label: kind === 'linkedin'
            ? 'LinkedIn'
            : kind === 'instagram'
              ? 'Instagram'
              : kind === 'facebook'
                ? 'Facebook'
                : kind === 'mastodon'
                  ? 'Mastodon'
                  : kind === 'bluesky'
                    ? 'Bluesky'
                    : kind === 'x'
                      ? 'X'
                      : kind,
          url
        }))
      ]
      for (const link of links) insertLink.run({
        id: recordIdFor(candidate.slug, link.kind, link.url),
        candidateSlug: candidate.slug,
        ...link,
        sourceId
      })
    }
    const portrait = portraitBySlug.get(candidate.slug)
    if (portrait) insertPortrait.run({
      candidateSlug: candidate.slug,
      imageUrl: portrait.imageUrl,
      author: portrait.author ?? null,
      license: portrait.license ?? null,
      licenseUrl: portrait.licenseUrl ?? null,
      status: portrait.status,
      provenance: portrait.provenance,
      sourceId: addSource(
        'candidate_portrait',
        portrait.sourceUrl,
        `${portrait.publisher}: Kandidierendenporträts`,
        portrait.publisher,
        null,
        portrait.retrievedAt
      ),
      retrievedAt: portrait.retrievedAt
    })
  }

  for (const programme of programmeContent) {
    const party = partyBySlug.get(programme.partySlug)!
    const sourceId = addSource(
      'programme',
      programme.sourceUrl,
      programme.title,
      party.name,
      programme.publicationDate ?? null,
      programme.retrievedAt
    )
    insertProgramme.run({
      partySlug: programme.partySlug,
      status: programme.status,
      title: programme.title,
      publicationDate: programme.publicationDate ?? null,
      summary: programme.summary,
      sourceId,
      retrievedAt: programme.retrievedAt
    })
    for (const [sortOrder, topic] of programme.topics.entries()) insertTopic.run({
      partySlug: programme.partySlug,
      slug: topic.slug,
      title: topic.title,
      summary: topic.summary,
      positionsJson: JSON.stringify(topic.positions),
      sourceId,
      sortOrder
    })
    for (const topic of programme.topics) {
      for (const [sortOrder, category] of (topic.categories ?? []).entries()) insertTopicCategory.run({
        partySlug: programme.partySlug,
        topicSlug: topic.slug,
        category,
        sortOrder
      })
    }
    for (const [sortOrder, document] of (programme.documents ?? []).entries()) {
      const documentSourceId = addSource(
        'programme_document',
        document.url,
        document.title,
        document.publisher,
        document.publicationDate ?? null,
        programme.retrievedAt
      )
      insertDocument.run({
        id: `${programme.partySlug}-${document.kind}-${sortOrder + 1}-${document.title}`.toLocaleLowerCase('de').replaceAll('ß', 'ss').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        partySlug: programme.partySlug,
        format: document.format,
        kind: document.kind,
        embeddable: document.embeddable === false ? 0 : 1,
        sourceId: documentSourceId,
        sortOrder
      })
    }
  }

  insertMetadata.run('retrieved_at', [...candidateProfiles.map(({ retrievedAt }) => retrievedAt), ...candidatePortraits.map(({ retrievedAt }) => retrievedAt), ...programmeContent.map(({ retrievedAt }) => retrievedAt)].sort().at(-1)!)
  insertMetadata.run('election_date', '2026-09-20')
  insertMetadata.run('admission_source_url', 'https://www.berlin.de/wahlen/pressemitteilungen/2026/pressemitteilung.1697177.php')
  insertMetadata.run('candidate_publication_url', 'https://www.berlin.de/wahlen/wahlen/berliner-wahlen-2026/wahlvorschlaege/artikel.1600254.php')
})()
db.close()
