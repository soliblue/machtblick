import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const POSITION_LABEL = {
  yes: 'zugestimmt',
  no: 'abgelehnt',
  abstain: 'enthalten',
  mixed: 'unterschiedlich abgestimmt',
}

export const PROMPT_VERSION = 'party-positions-v2'
const TEMPLATE = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/party-positions.md', import.meta.url)), 'utf8').trimEnd()

export function buildPrompt({ vote, speeches }) {
  const input = {
    abstimmung: {
      id: vote.vote_id,
      datum: vote.date,
      titel: vote.clean_title,
      offizieller_titel: vote.title,
      kurze_antragszusammenfassung: vote.summary_simplified ?? vote.summary ?? null,
      ergebnis: vote.result,
      ...(vote.inverted
        ? {
            hinweis_abstimmungsform:
              'Abgestimmt wurde formal über eine Beschlussempfehlung zur Ablehnung des Antrags. Die Felder abstimmungsverhalten, ergebnis und stimmen sind bereits auf den Antrag selbst normalisiert: zugestimmt heißt für den Antrag, abgelehnt heißt gegen den Antrag. Beschreibe die Haltung der Partei immer zum Antrag selbst, nicht zur Beschlussempfehlung, und verwende ausschließlich das angegebene abstimmungsverhalten.',
          }
        : {}),
    },
    partei: {
      name: vote.party,
      abstimmungsverhalten: POSITION_LABEL[vote.position] ?? vote.position,
      stimmen: vote.members == null ? null : {
        ja: vote.yes ?? 0,
        nein: vote.no ?? 0,
        enthalten: vote.abstain ?? 0,
        nicht_abgegeben: vote.absent ?? 0,
        mitglieder: vote.members,
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
