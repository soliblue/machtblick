import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const POSITION_LABEL = {
  yes: 'zugestimmt',
  no: 'abgelehnt',
  abstain: 'enthalten',
  mixed: 'unterschiedlich abgestimmt',
}

export const PROMPT_VERSION = 'party-positions-v1'
const TEMPLATE = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/party-positions.md', import.meta.url)), 'utf8').trimEnd()

export function buildPrompt({ vote, speeches }) {
  const input = {
    abstimmung: {
      id: vote.vote_id,
      datum: vote.date,
      titel: vote.clean_title ?? vote.title,
      offizieller_titel: vote.title,
      kurze_antragszusammenfassung: vote.summary_simplified ?? vote.summary ?? null,
      ergebnis: vote.result,
    },
    partei: {
      name: vote.party,
      abstimmungsverhalten: POSITION_LABEL[vote.position] ?? vote.position,
      stimmen: {
        ja: vote.yes ?? 0,
        nein: vote.no ?? 0,
        enthalten: vote.abstain ?? 0,
        nicht_abgegeben: vote.absent ?? 0,
        mitglieder: vote.members ?? 0,
      },
    },
    reden: speeches.map((s) => ({
      id: s.id,
      redner: s.speaker_name,
      rolle: s.speaker_role,
      reihenfolge: s.position,
      text: s.text_full,
    })),
  }
  return TEMPLATE.replace('__INPUT_JSON__', JSON.stringify(input, null, 2))
}
