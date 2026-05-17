type VoteOrderRow = {
  id: string
  date: string
  bundestagId?: number | null
  bundestag_id?: number | null
}

export function compareVotesNewest(a: VoteOrderRow, b: VoteOrderRow) {
  const byDate = b.date.localeCompare(a.date)
  return byDate || voteOrderValue(b) - voteOrderValue(a) || b.id.localeCompare(a.id)
}

function voteOrderValue(row: VoteOrderRow) {
  const protocol = row.id.match(/^pp(\d+)-(\d+)-(\d+)-/)
  return protocol ? Number(protocol[3]) : row.bundestagId ?? row.bundestag_id ?? 0
}
