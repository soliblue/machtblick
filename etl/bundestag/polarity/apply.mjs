export function substantiveResultFromSummaries(db, voteId) {
  const summaries = db.prepare(`SELECT party, position FROM vote_party_summaries WHERE vote_id = ?`).all(voteId)
  const seats = db.prepare(`
    SELECT s.party, MAX(s.members) AS m
    FROM vote_party_summaries s
    JOIN votes v ON v.id = s.vote_id
    WHERE v.vote_type = 'namentlich' AND s.members IS NOT NULL
    GROUP BY s.party
  `).all()
  const seatMap = new Map(seats.map((r) => [r.party, r.m]))
  let yesSeats = 0
  let noSeats = 0
  for (const s of summaries) {
    const m = seatMap.get(s.party) ?? 0
    if (s.position === 'yes') yesSeats += m
    else if (s.position === 'no') noSeats += m
  }
  return yesSeats > noSeats ? 'angenommen' : 'abgelehnt'
}

export function applyInversion(db, row, decision) {
  const newTitle = decision.rewrittenTitle ?? row.title
  const newYes = row.no
  const newNo = row.yes

  db.prepare(`
    UPDATE vote_members
    SET choice = CASE choice WHEN 'ja' THEN 'nein' WHEN 'nein' THEN 'ja' ELSE choice END
    WHERE vote_id = ?
  `).run(row.id)

  db.prepare(`
    UPDATE vote_party_summaries
    SET yes = no, no = yes,
        position = CASE position WHEN 'yes' THEN 'no' WHEN 'no' THEN 'yes' ELSE position END
    WHERE vote_id = ?
  `).run(row.id)

  const computedResult =
    newYes != null && newNo != null
      ? newYes > newNo
        ? 'angenommen'
        : 'abgelehnt'
      : substantiveResultFromSummaries(db, row.id)

  db.prepare(`
    UPDATE votes
    SET yes = ?, no = ?, result = ?, inverted = 1
    WHERE id = ?
  `).run(newYes, newNo, computedResult, row.id)

  db.prepare(`
    INSERT INTO vote_polarity_decisions (vote_id, inverted, source, confidence, reason, rewritten_title, original_title, decided_at)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(vote_id) DO UPDATE SET
      inverted = 1, source = excluded.source, confidence = excluded.confidence,
      reason = excluded.reason, rewritten_title = excluded.rewritten_title,
      original_title = excluded.original_title, decided_at = excluded.decided_at
  `).run(row.id, decision.source, decision.confidence ?? null, decision.reason ?? null, newTitle, row.title, new Date().toISOString())
}

export function recordNoInversion(db, row, decision) {
  db.prepare(`
    INSERT INTO vote_polarity_decisions (vote_id, inverted, source, confidence, reason, rewritten_title, original_title, decided_at)
    VALUES (?, 0, ?, ?, ?, NULL, ?, ?)
    ON CONFLICT(vote_id) DO NOTHING
  `).run(row.id, decision.source, decision.confidence ?? null, decision.reason ?? null, row.title, new Date().toISOString())
}

export function defectionSignature(db, voteId) {
  const summaryRows = db.prepare(`SELECT party, yes, no, abstain, absent FROM vote_party_summaries WHERE vote_id = ?`).all(voteId)
  const majorityByParty = new Map()
  for (const s of summaryRows) {
    const choices = [['ja', s.yes ?? 0], ['nein', s.no ?? 0], ['enthalten', s.abstain ?? 0], ['nicht_abgegeben', s.absent ?? 0]]
    const top = choices.reduce((a, b) => (b[1] > a[1] ? b : a))
    majorityByParty.set(s.party, top[0])
  }
  const ballots = db.prepare(`
    SELECT vm.member_id, vm.choice, ma.party AS aff_party
    FROM vote_members vm
    LEFT JOIN member_affiliations ma ON ma.member_id = vm.member_id
      AND date(?) >= date(ma.valid_from)
      AND (ma.valid_to IS NULL OR date(?) <= date(ma.valid_to))
    WHERE vm.vote_id = ?
  `).all((db.prepare('SELECT date FROM votes WHERE id = ?').get(voteId) ?? {}).date ?? '', (db.prepare('SELECT date FROM votes WHERE id = ?').get(voteId) ?? {}).date ?? '', voteId)
  let count = 0
  for (const b of ballots) {
    if (!b.aff_party || b.choice === 'nicht_abgegeben') continue
    const maj = majorityByParty.get(b.aff_party)
    if (maj && b.choice !== maj) count++
  }
  return count
}
