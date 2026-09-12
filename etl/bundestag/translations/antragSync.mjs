export function matchingAntragDescription(db, voteId, summarySimplified, summaryDetail) {
  const matches = db.prepare(`
    SELECT a.id, a.drucksache, ad.summary_simplified, ad.summary_detail
    FROM antraege a
    INNER JOIN vote_description_decisions vdd ON vdd.drucksache_id = a.drucksache
    INNER JOIN antrag_descriptions ad ON ad.antrag_id = a.id
    WHERE a.wahlperiode = 21
      AND vdd.vote_id = ?
      AND ad.summary_simplified IS ?
      AND ad.summary_detail IS ?
  `).all(voteId, summarySimplified, summaryDetail)
  return matches.length === 1 ? matches[0] : null
}
