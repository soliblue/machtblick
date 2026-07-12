import { CURRENT_TERM } from './term'

export const linkedVotesCte = `WITH linked_votes AS (
  SELECT speech_id, vote_id, row_number() OVER (
    PARTITION BY speech_id
    ORDER BY confidence DESC, CASE source WHEN 'direct' THEN 0 ELSE 1 END, vote_id
  ) AS rn
  FROM speech_vote_links
)`

export const linkedVoteJoin = `LEFT JOIN linked_votes lv ON lv.speech_id = s.id AND lv.rn = 1
LEFT JOIN votes v ON v.id = lv.vote_id AND v.term_id = ${CURRENT_TERM} AND v.procedural = 0 AND v.vote_type != 'hammelsprung'`

export const debateContextJoins = `LEFT JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = s.id
LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item`

export const isRelatedDebate = (row: { debate_source: string | null; date: string }, voteDate: string | undefined) =>
  row.debate_source === 'related' || row.date !== voteDate
