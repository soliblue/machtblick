export function speechSourcesChanged(sourceSpeechIds, speeches) {
  const recorded = new Set(JSON.parse(sourceSpeechIds ?? '[]'))
  const current = new Set(speeches.map((speech) => speech.id))
  return recorded.size !== current.size || [...current].some((id) => !recorded.has(id))
}

export function shouldClearGeneratedSummary(row, sourcesChanged, speeches, words, minWords) {
  return Boolean(row.generated_at)
    && sourcesChanged
    && (speeches.length === 0 || words < minWords)
}

export function clearGeneratedSummaries(db, rows) {
  if (rows.length > 0) db.transaction((staleRows) => {
    const clearSummary = db.prepare(`
      UPDATE vote_party_summaries
      SET position_summary = NULL, key_points = NULL, dissent_note = NULL
      WHERE vote_id = ? AND party = ?
    `)
    const deleteDecision = db.prepare('DELETE FROM vote_party_summary_decisions WHERE vote_id = ? AND party = ?')
    const deleteTranslations = db.prepare('DELETE FROM vote_party_summary_translations WHERE vote_id = ? AND party = ?')
    for (const row of staleRows) {
      clearSummary.run(row.vote_id, row.party)
      deleteDecision.run(row.vote_id, row.party)
      deleteTranslations.run(row.vote_id, row.party)
    }
  })(rows)
}
