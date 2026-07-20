import Database from 'better-sqlite3'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isGenericStem, normalizeText, readingStage, stemKey, stripStage } from './readingPairs'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))
const rawDir = fileURLToPath(new URL('../etl/bundestag-reden-xml/raw/xml/', import.meta.url))
const termId = 21

const drucksacheRe = /\b21\/\d{1,5}\b/g
const topOpenRe = /<tagesordnungspunkt\s+top-id="([^"]+)"\s*>/g
const topCloseRe = /<\/tagesordnungspunkt>/g
const tDrsParaRe = /<p klasse="T_Drs"[^>]*>([\s\S]*?)<\/p>/g
const sessionNumberRe = /<sitzungsnr>(\d+)<\/sitzungsnr>/
const sessionDateRe = /sitzung-datum="([^"]+)"/
const verlaufOpenRe = /<sitzungsverlauf>/
const verlaufCloseRe = /<\/sitzungsverlauf>/
const stageSuffixDe = { second: '(2. Beratung)', third: '(3. Beratung)', final: '(Schlussabstimmung)' } as const
const stageSuffixEn = { second: '(second reading)', third: '(third reading)', final: '(final vote)' } as const

type VoteRow = {
  id: string
  date: string
  agenda_item: string | null
  title: string
  clean_title: string | null
  document: string | null
  initiator: string | null
  summary: string | null
  summary_simplified: string | null
  summary_detail: string | null
  subject: string | null
  topic: string | null
  context_json: string | null
  procedure_json: string | null
}

type TranslationRow = {
  vote_id: string
  locale: string
  clean_title: string | null
}

type TopBlock = {
  date: string
  topId: string
  order: number
  drucksachen: Set<string>
  formalDrucksachen: Set<string>
}

type CountRow = { c: number }
type SpeechCountRow = { total: number; open: number }
type InitiatorRow = { id: string; title: string; document: string | null; is_petition_bundle: number }

const voteRows = db.prepare(`
  SELECT id, date, agenda_item, title, clean_title, document, initiator, summary, summary_simplified, summary_detail, subject, topic, context_json, procedure_json
  FROM votes
  WHERE term_id = ? AND vote_type = 'handzeichen' AND procedural = 0
  ORDER BY date, id
`).all(termId) as VoteRow[]

const translations = db.prepare('SELECT vote_id, locale, clean_title FROM vote_translations').all() as TranslationRow[]
const translationsByVote = new Map<string, TranslationRow[]>()

for (const t of translations) {
  const rows = translationsByVote.get(t.vote_id) ?? []
  rows.push(t)
  translationsByVote.set(t.vote_id, rows)
}

const documentCount = db.prepare('SELECT COUNT(*) AS c FROM vote_documents WHERE vote_id = ?')
const antragCount = db.prepare('SELECT COUNT(*) AS c FROM vote_antraege WHERE vote_id = ?')
const decisionCount = db.prepare('SELECT COUNT(*) AS c FROM vote_description_decisions WHERE vote_id = ?')
const partySummaryTextCount = db.prepare(`
  SELECT COUNT(*) AS c FROM vote_party_summaries
  WHERE vote_id = ? AND (position_summary IS NOT NULL OR key_points IS NOT NULL OR dissent_note IS NOT NULL)
`)
const updateVoteMetadata = db.prepare(`
  UPDATE votes SET
    document = COALESCE(document, (SELECT document FROM votes WHERE id = @sourceId)),
    initiator = COALESCE(initiator, (SELECT initiator FROM votes WHERE id = @sourceId)),
    summary = COALESCE(summary, (SELECT summary FROM votes WHERE id = @sourceId)),
    summary_simplified = COALESCE(summary_simplified, (SELECT summary_simplified FROM votes WHERE id = @sourceId)),
    summary_detail = COALESCE(summary_detail, (SELECT summary_detail FROM votes WHERE id = @sourceId)),
    subject = COALESCE(subject, (SELECT subject FROM votes WHERE id = @sourceId)),
    topic = COALESCE(topic, (SELECT topic FROM votes WHERE id = @sourceId)),
    context_json = COALESCE(context_json, (SELECT context_json FROM votes WHERE id = @sourceId)),
    procedure_json = COALESCE(procedure_json, (SELECT procedure_json FROM votes WHERE id = @sourceId))
  WHERE id = @targetId
`)
const updateAgendaItem = db.prepare('UPDATE votes SET agenda_item = ? WHERE id = ? AND agenda_item IS NULL')
const copyVoteDocuments = db.prepare(`
  INSERT INTO vote_documents (vote_id, label, title, url)
  SELECT @targetId, label, title, url FROM vote_documents WHERE vote_id = @sourceId
`)
const copyVoteAntraege = db.prepare(`
  INSERT OR IGNORE INTO vote_antraege (vote_id, antrag_id)
  SELECT @targetId, antrag_id FROM vote_antraege WHERE vote_id = @sourceId
`)
const copyDescriptionDecision = db.prepare(`
  INSERT OR IGNORE INTO vote_description_decisions (vote_id, drucksache_id, source_pdf_url, model, generated_at, prompt_version)
  SELECT @targetId, drucksache_id, source_pdf_url, model, generated_at, prompt_version
  FROM vote_description_decisions WHERE vote_id = @sourceId
`)
const copyTranslationMetadata = db.prepare(`
  UPDATE vote_translations SET
    topic = COALESCE(topic, (SELECT topic FROM vote_translations source WHERE source.vote_id = @sourceId AND source.locale = vote_translations.locale)),
    subject = COALESCE(subject, (SELECT subject FROM vote_translations source WHERE source.vote_id = @sourceId AND source.locale = vote_translations.locale)),
    summary = COALESCE(summary, (SELECT summary FROM vote_translations source WHERE source.vote_id = @sourceId AND source.locale = vote_translations.locale)),
    summary_simplified = COALESCE(summary_simplified, (SELECT summary_simplified FROM vote_translations source WHERE source.vote_id = @sourceId AND source.locale = vote_translations.locale)),
    summary_detail = COALESCE(summary_detail, (SELECT summary_detail FROM vote_translations source WHERE source.vote_id = @sourceId AND source.locale = vote_translations.locale))
  WHERE vote_id = @targetId
`)
const copyPartySummaryText = db.prepare(`
  UPDATE vote_party_summaries SET
    position_summary = COALESCE(position_summary, (SELECT position_summary FROM vote_party_summaries source WHERE source.vote_id = @sourceId AND source.party = vote_party_summaries.party)),
    key_points = COALESCE(key_points, (SELECT key_points FROM vote_party_summaries source WHERE source.vote_id = @sourceId AND source.party = vote_party_summaries.party)),
    dissent_note = COALESCE(dissent_note, (SELECT dissent_note FROM vote_party_summaries source WHERE source.vote_id = @sourceId AND source.party = vote_party_summaries.party))
  WHERE vote_id = @targetId AND EXISTS (
    SELECT 1 FROM vote_party_summaries source WHERE source.vote_id = @sourceId AND source.party = vote_party_summaries.party
  ) AND (
    (position_summary IS NULL AND (SELECT position_summary FROM vote_party_summaries source WHERE source.vote_id = @sourceId AND source.party = vote_party_summaries.party) IS NOT NULL)
    OR (key_points IS NULL AND (SELECT key_points FROM vote_party_summaries source WHERE source.vote_id = @sourceId AND source.party = vote_party_summaries.party) IS NOT NULL)
    OR (dissent_note IS NULL AND (SELECT dissent_note FROM vote_party_summaries source WHERE source.vote_id = @sourceId AND source.party = vote_party_summaries.party) IS NOT NULL)
  )
`)
const copyPartySummaryDecisions = db.prepare(`
  INSERT OR IGNORE INTO vote_party_summary_decisions (vote_id, party, source_speech_ids, model, prompt_version, generated_at)
  SELECT @targetId, party, source_speech_ids, model, prompt_version, generated_at
  FROM vote_party_summary_decisions source
  WHERE source.vote_id = @sourceId AND EXISTS (
    SELECT 1 FROM vote_party_summaries target WHERE target.vote_id = @targetId AND target.party = source.party
  )
`)
const copyPartySummaryTranslations = db.prepare(`
  INSERT OR IGNORE INTO vote_party_summary_translations (vote_id, party, locale, position_summary, key_points, dissent_note, source_hash, model, prompt_version, translated_at)
  SELECT @targetId, party, locale, position_summary, key_points, dissent_note, source_hash, model, prompt_version, translated_at
  FROM vote_party_summary_translations source
  WHERE source.vote_id = @sourceId AND EXISTS (
    SELECT 1 FROM vote_party_summaries target WHERE target.vote_id = @targetId AND target.party = source.party
  )
`)
const updateCleanTitle = db.prepare('UPDATE votes SET clean_title = ? WHERE id = ?')
const updateTranslationCleanTitle = db.prepare('UPDATE vote_translations SET clean_title = ? WHERE vote_id = ? AND locale = ?')
const updateVoteInitiator = db.prepare('UPDATE votes SET initiator = @initiator WHERE id = @id AND (initiator IS NULL OR initiator != @initiator)')
const updateVoteDocument = db.prepare('UPDATE votes SET document = ? WHERE id = ?')
const updatePetitionBundle = db.prepare('UPDATE votes SET is_petition_bundle = 1 WHERE id = ? AND is_petition_bundle = 0')
const documentLabelsForVote = db.prepare('SELECT label FROM vote_documents WHERE vote_id = ?')

let metadataCopies = 0
let agendaCopies = 0
let documentCopies = 0
let antragCopies = 0
let decisionCopies = 0
let partySummaryCopies = 0
let partySummaryDecisionCopies = 0
let partySummaryTranslationCopies = 0
let titleLabels = 0
let initiatorFixes = 0
let documentFixes = 0
let petitionBundleFixes = 0

db.transaction(() => {
  const groups = new Map<string, VoteRow[]>()
  for (const row of voteRows) {
    const key = stemKey(row.title)
    if (isGenericStem(key)) continue
    const groupKey = `${row.date}\u0000${key}`
    const rows = groups.get(groupKey) ?? []
    rows.push(row)
    groups.set(groupKey, rows)
  }

  for (const rows of groups.values()) {
    if (rows.length < 2) continue
    if (!rows.some((row) => readingStage(row.title))) continue
    const metadataSource = rows.reduce((best, row) => readingSourceScore(row) > readingSourceScore(best) ? row : best, rows[0])
    const agendaSource = rows.find((row) => row.agenda_item) ?? metadataSource
    const documentSource = sourceFor(rows, (row) => (documentCount.get(row.id) as CountRow).c > 0) ?? metadataSource
    const antragSource = sourceFor(rows, (row) => (antragCount.get(row.id) as CountRow).c > 0) ?? metadataSource
    const decisionSource = sourceFor(rows, (row) => (decisionCount.get(row.id) as CountRow).c > 0) ?? metadataSource
    const partySummarySource = sourceFor(rows, (row) => (partySummaryTextCount.get(row.id) as CountRow).c > 0)
    const baseTitle = stripStage(metadataSource.clean_title ?? rows.find((row) => row.clean_title)?.clean_title ?? metadataSource.title)
    const sourceEnglishTitle = stripStage(translationsByVote.get(metadataSource.id)?.find((row) => row.locale === 'en')?.clean_title ?? '')

    for (const row of rows) {
      const beforeDocs = (documentCount.get(row.id) as CountRow).c
      const beforeAntraege = (antragCount.get(row.id) as CountRow).c
      const beforeDecision = (decisionCount.get(row.id) as CountRow).c
      if (row.id !== metadataSource.id && missingCopiedMetadata(row, metadataSource)) {
        metadataCopies += updateVoteMetadata.run({ sourceId: metadataSource.id, targetId: row.id }).changes
        copyTranslationMetadata.run({ sourceId: metadataSource.id, targetId: row.id })
      }
      if (!row.agenda_item && agendaSource.agenda_item && row.id !== agendaSource.id) agendaCopies += updateAgendaItem.run(agendaSource.agenda_item, row.id).changes
      if (beforeDocs === 0 && row.id !== documentSource.id) documentCopies += copyVoteDocuments.run({ sourceId: documentSource.id, targetId: row.id }).changes
      if (beforeAntraege === 0 && row.id !== antragSource.id) antragCopies += copyVoteAntraege.run({ sourceId: antragSource.id, targetId: row.id }).changes
      if (beforeDecision === 0 && row.id !== decisionSource.id) decisionCopies += copyDescriptionDecision.run({ sourceId: decisionSource.id, targetId: row.id }).changes
      if (partySummarySource && row.id !== partySummarySource.id) {
        partySummaryCopies += copyPartySummaryText.run({ sourceId: partySummarySource.id, targetId: row.id }).changes
        partySummaryDecisionCopies += copyPartySummaryDecisions.run({ sourceId: partySummarySource.id, targetId: row.id }).changes
        partySummaryTranslationCopies += copyPartySummaryTranslations.run({ sourceId: partySummarySource.id, targetId: row.id }).changes
      }

      const stage = readingStage(row.title)
      const suffix = stage ? stageSuffixDe[stage] : null
      if (suffix) {
        const nextTitle = `${baseTitle} ${suffix}`
        if (row.clean_title !== nextTitle) {
          updateCleanTitle.run(nextTitle, row.id)
          titleLabels += 1
        }
      }

      const englishSuffixValue = stage ? stageSuffixEn[stage] : null
      for (const t of translationsByVote.get(row.id) ?? []) {
        if (t.locale !== 'en' || !englishSuffixValue) continue
        const englishBase = sourceEnglishTitle || stripStage(t.clean_title ?? '')
        if (!englishBase) continue
        const nextTitle = `${englishBase} ${englishSuffixValue}`
        if (t.clean_title !== nextTitle) {
          updateTranslationCleanTitle.run(nextTitle, row.id, t.locale)
          titleLabels += 1
        }
      }
    }
  }

  const initiatorRows = db.prepare(`
    SELECT id, title, document, is_petition_bundle
    FROM votes
    WHERE term_id = ? AND procedural = 0
      AND (
        initiator IS NULL
        OR is_petition_bundle = 1
        OR title LIKE '%Petitionsausschuss%'
        OR title LIKE '%Sammelübersicht%'
        OR title LIKE '%Wahlprüfungsausschuss%'
        OR document LIKE '%Petitionsausschuss%'
        OR document LIKE '%Wahlprüfungsausschuss%'
      )
  `).all(termId) as InitiatorRow[]
  for (const row of initiatorRows) {
    const fixedDocument = petitionDocument(row) ?? wahlpruefungDocument(row)
    const initiator = initiatorFromVote(row)
    if (isPetitionBundle(row)) petitionBundleFixes += updatePetitionBundle.run(row.id).changes
    if (initiator) initiatorFixes += updateVoteInitiator.run({ initiator, id: row.id }).changes
    if (fixedDocument && fixedDocument !== row.document) documentFixes += updateVoteDocument.run(fixedDocument, row.id).changes
  }
})()

const blocks = topBlocks()
const directSpeechCount = db.prepare('SELECT COUNT(*) AS c FROM speeches WHERE date = ? AND agenda_item = ?')
const linkedSpeechCount = db.prepare('SELECT COUNT(*) AS c FROM speeches WHERE vote_id = ?')
const speechBlockCount = db.prepare(`
  SELECT COUNT(*) AS total, SUM(CASE WHEN vote_id IS NULL THEN 1 ELSE 0 END) AS open
  FROM speeches WHERE date = ? AND agenda_item = ?
`)
const linkSpeeches = db.prepare('UPDATE speeches SET vote_id = ? WHERE date = ? AND agenda_item = ? AND vote_id IS NULL')
const clearBroadHandLinks = db.prepare(`
  UPDATE speeches SET vote_id = NULL
  WHERE vote_id IN (
    SELECT id FROM votes
    WHERE term_id = ? AND vote_type != 'namentlich'
  )
  AND date < (SELECT date FROM votes WHERE votes.id = speeches.vote_id)
`)
const allVotes = db.prepare(`
  SELECT id, date, agenda_item, title, document
  FROM votes
  WHERE term_id = ? AND procedural = 0 AND vote_type = 'namentlich'
  ORDER BY date, id
`).all(termId) as Pick<VoteRow, 'id' | 'date' | 'agenda_item' | 'title' | 'document'>[]

let relatedVotes = 0
let relatedSpeeches = 0
let clearedHandRelatedSpeeches = 0

db.transaction(() => {
  clearedHandRelatedSpeeches = clearBroadHandLinks.run(termId).changes
  for (const vote of allVotes) {
    const direct = vote.agenda_item ? (directSpeechCount.get(vote.date, vote.agenda_item) as CountRow).c : 0
    const linked = (linkedSpeechCount.get(vote.id) as CountRow).c
    if (direct > 0 || linked > 0) continue
    const docs = drucksachenForVote(vote.id, vote.document ?? '')
    if (docs.size === 0) continue
    const candidate = blocks
      .map((block) => {
        const formalHits = [...docs].filter((d) => block.formalDrucksachen.has(d)).length
        const allHits = [...docs].filter((d) => block.drucksachen.has(d)).length
        const counts = speechBlockCount.get(block.date, block.topId) as SpeechCountRow
        return { block, formalHits, allHits, openSpeeches: counts.open ?? 0, score: formalHits * 10 + allHits }
      })
      .filter((hit) => hit.block.date < vote.date && hit.formalHits > 0 && hit.openSpeeches > 0)
      .sort((a, b) => b.score - a.score || b.block.date.localeCompare(a.block.date) || a.block.order - b.block.order)[0]
    if (!candidate) continue
    const changed = linkSpeeches.run(vote.id, candidate.block.date, candidate.block.topId).changes
    if (changed > 0) {
      relatedVotes += 1
      relatedSpeeches += changed
    }
  }
})()

console.log(`reading metadata copied: ${metadataCopies}`)
console.log(`reading agenda items copied: ${agendaCopies}`)
console.log(`vote documents copied: ${documentCopies}`)
console.log(`vote antrag links copied: ${antragCopies}`)
console.log(`description decisions copied: ${decisionCopies}`)
console.log(`party summary text copied: ${partySummaryCopies}`)
console.log(`party summary decisions copied: ${partySummaryDecisionCopies}`)
console.log(`party summary translations copied: ${partySummaryTranslationCopies}`)
console.log(`reading title labels updated: ${titleLabels}`)
console.log(`initiators fixed: ${initiatorFixes}`)
console.log(`documents fixed: ${documentFixes}`)
console.log(`petition bundles fixed: ${petitionBundleFixes}`)
console.log(`broad hand related speeches cleared: ${clearedHandRelatedSpeeches}`)
console.log(`related speech votes linked: ${relatedVotes}`)
console.log(`related speeches linked: ${relatedSpeeches}`)

db.close()

function missingCopiedMetadata(row: VoteRow, source: VoteRow) {
  return Boolean(
    (!row.document && source.document)
      || (!row.initiator && source.initiator)
      || (!row.summary && source.summary)
      || (!row.summary_simplified && source.summary_simplified)
      || (!row.summary_detail && source.summary_detail)
      || (!row.subject && source.subject)
      || (!row.topic && source.topic)
      || (!row.context_json && source.context_json)
      || (!row.procedure_json && source.procedure_json),
  )
}

function readingSourceScore(row: VoteRow) {
  return (row.document || row.initiator || row.summary || row.summary_simplified || row.summary_detail || row.subject || row.topic ? 100 : 0)
    + ((documentCount.get(row.id) as CountRow).c > 0 ? 30 : 0)
    + ((antragCount.get(row.id) as CountRow).c > 0 ? 20 : 0)
    + ((decisionCount.get(row.id) as CountRow).c > 0 ? 20 : 0)
    + ((partySummaryTextCount.get(row.id) as CountRow).c > 0 ? 10 : 0)
    + (row.agenda_item ? 5 : 0)
}

function sourceFor(rows: VoteRow[], predicate: (row: VoteRow) => boolean) {
  return rows.filter(predicate).sort((a, b) => readingSourceScore(b) - readingSourceScore(a))[0] ?? null
}

function initiatorFromVote(row: InitiatorRow) {
  if (isPetitionBundle(row)) return 'Petitionsausschuss'
  if (isWahlpruefung(row)) return 'Wahlprüfungsausschuss'
  return initiatorFromDocument(row.document) ?? initiatorFromTitle(row.title)
}

function initiatorFromDocument(document: string | null) {
  if (!document) return null
  const fraktion = document.match(/Fraktion(?:en)?\s+(?:der\s+|des\s+)?([^()]+?)(?:[:,(]|$|\s+(?:zu|zum|zur|Entwurf|Drucksache))/i)
  if (fraktion) return knownInitiator(fraktion[1])
  if (/(?:Antrag|Gesetzentwurf)(?:es)?\s+der\s+Bundesregierung/i.test(document)) return 'Bundesregierung'
  if (/(?:Antrag|Gesetzentwurf)(?:es)?\s+des\s+Bundesrates/i.test(document)) return 'Bundesrat'
  if (/Petitionsausschuss/i.test(document)) return 'Petitionsausschuss'
  if (/Wahlprufungsausschuss/i.test(normalizeText(document))) return 'Wahlprüfungsausschuss'
  return knownInitiator(document)
}

function initiatorFromTitle(title: string) {
  if (/^Wahlvorschlage\s+der\s+Fraktion/i.test(normalizeText(title))) return knownInitiator(title)
  if (/^Einzelplan\s+\d+/i.test(title)) return 'Bundesregierung'
  if (/^Haushaltsgesetz\b/i.test(title)) return 'Bundesregierung'
  if (/^Haushaltbegleitgesetz\b/i.test(title)) return 'Bundesregierung'
  return null
}

function knownInitiator(value: string) {
  const normalized = normalizeText(value)
  if (normalized.includes('cdu csu')) return 'CDU/CSU'
  if (normalized.includes('bundnis 90 die grunen') || normalized.includes('b90 grune')) return 'B90/Grüne'
  if (normalized.includes('die linke')) return 'Die Linke'
  if (/\bspd\b/.test(normalized)) return 'SPD'
  if (/\bafd\b/.test(normalized)) return 'AfD'
  if (/\bfdp\b/.test(normalized)) return 'FDP'
  if (/\bbsw\b/.test(normalized)) return 'BSW'
  if (normalized.includes('bundesregierung')) return 'Bundesregierung'
  if (normalized.includes('bundesrat')) return 'Bundesrat'
  return null
}

function petitionDocument(row: InitiatorRow) {
  if (!isPetitionBundle(row)) return null
  const drucksachen = drucksachenForDocumentRow(row)
  return drucksachen.length ? `Beschlussempfehlung des Petitionsausschusses (Drucksache ${drucksachen.join(', ')})` : null
}

function wahlpruefungDocument(row: InitiatorRow) {
  if (!isWahlpruefung(row)) return null
  const drucksachen = drucksachenForDocumentRow(row)
  return drucksachen.length ? `Beschlussempfehlung des Wahlprüfungsausschusses (Drucksache ${drucksachen.join(', ')})` : null
}

function drucksachenForDocumentRow(row: InitiatorRow) {
  const out = new Set<string>()
  for (const match of (row.document ?? '').matchAll(drucksacheRe)) out.add(match[0])
  for (const doc of documentLabelsForVote.all(row.id) as Array<{ label: string }>) {
    for (const match of doc.label.matchAll(drucksacheRe)) out.add(match[0])
  }
  return [...out]
}

function isPetitionBundle(row: InitiatorRow) {
  return Boolean(row.is_petition_bundle)
    || /^Sammelübersicht\s+\d+\s+zu\s+Petitionen/i.test(row.title)
    || /^Petitionsausschuss\s+Sammelübersicht\s+\d+/i.test(row.title)
    || /Petitionsausschuss/i.test(row.document ?? '')
}

function isWahlpruefung(row: InitiatorRow) {
  return normalizeText(row.title).includes('wahlprufungsausschuss') || normalizeText(row.document ?? '').includes('wahlprufungsausschuss')
}

function drucksachenForVote(voteId: string, document: string) {
  const out = new Set<string>()
  for (const match of document.matchAll(drucksacheRe)) out.add(match[0])
  for (const row of documentLabelsForVote.all(voteId) as Array<{ label: string }>) {
    for (const match of row.label.matchAll(drucksacheRe)) out.add(match[0])
  }
  return out
}

function topBlocks() {
  const out: TopBlock[] = []
  for (const file of readdirSync(rawDir).filter((name) => name.endsWith('.xml')).sort()) {
    const xml = readFileSync(join(rawDir, file), 'utf8')
    const sessionNumber = xml.match(sessionNumberRe)?.[1]
    const date = parseGermanDate(xml.match(sessionDateRe)?.[1])
    if (!sessionNumber || !date) continue
    const body = xml.slice(xml.match(verlaufOpenRe)?.index ?? 0, xml.match(verlaufCloseRe)?.index ?? xml.length)
    const events: Array<{ idx: number; kind: 'open' | 'close'; topId?: string }> = []
    for (const match of body.matchAll(topOpenRe)) events.push({ idx: match.index!, kind: 'open', topId: match[1] })
    for (const match of body.matchAll(topCloseRe)) events.push({ idx: match.index!, kind: 'close' })
    events.sort((a, b) => a.idx - b.idx)
    const stack: Array<{ topId: string; from: number }> = []
    let order = 0
    for (const event of events) {
      if (event.kind === 'open') {
        stack.push({ topId: event.topId!, from: event.idx })
      } else {
        const top = stack.pop()
        if (top) {
          const segment = body.slice(top.from, event.idx)
          const drucksachen = new Set([...segment.matchAll(drucksacheRe)].map((match) => match[0]))
          const formalDrucksachen = new Set<string>()
          for (const tDrs of segment.matchAll(tDrsParaRe)) for (const match of tDrs[1].matchAll(drucksacheRe)) formalDrucksachen.add(match[0])
          out.push({ date, topId: top.topId, order: order++, drucksachen, formalDrucksachen })
        }
      }
    }
  }
  return out
}

function parseGermanDate(raw: string | null | undefined) {
  const match = raw?.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : null
}
