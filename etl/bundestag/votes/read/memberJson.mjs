import { readFile } from 'node:fs/promises'

const BASE = `${process.env.HOME}/Desktop/CODING/German-Politics/app/public/data/votes`

export async function loadMemberVotes(voteId) {
  const raw = await readFile(`${BASE}/${voteId}.json`, 'utf8')
  return JSON.parse(raw).memberVotes
}
