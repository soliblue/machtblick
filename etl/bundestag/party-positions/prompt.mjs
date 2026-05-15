const POSITION_LABEL = {
  yes: 'zugestimmt',
  no: 'abgelehnt',
  abstain: 'enthalten',
  mixed: 'unterschiedlich abgestimmt',
}

export const PROMPT_VERSION = 'party-positions-v1'

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
  return `Du fasst Bundestagsreden für ein gemeinnütziges Transparenzportal zusammen.

Aufgabe:
Fasse die Position der angegebenen Partei zu genau dieser Abstimmung zusammen.
Nutze nur die Reden in der Eingabe.
Die Reden wurden über speeches.vote_id der Abstimmung zugeordnet und nach derselben Partei gefiltert.
Wenn einzelne Zwischenrufe oder kurze Wortmeldungen nichts zur Sache beitragen, ignoriere sie.
Erfinde keine Argumente, keine Motive und keine Fakten von außen.

Stil:
Schreibe auf einfachem Deutsch, ungefähr wie ELI5 für Erwachsene.
position_summary soll 5 bis 10 kurze Sätze haben.
Jeder Satz soll eine konkrete Aussage enthalten.
Keine langen Schachtelsätze.
Keine Parteikommentare von außen.
Keine Anglizismen, wenn ein einfaches deutsches Wort reicht.
Keine Gedankenstriche.

Inhalt:
Sage klar, ob die Partei zugestimmt, abgelehnt, sich enthalten oder unterschiedlich abgestimmt hat.
Erkläre dann die wichtigsten Gründe aus den Reden.
Wenn die Reden kaum erklären, warum so abgestimmt wurde, sage das knapp und bleibe bei dem, was gesagt wurde.
key_points enthält 3 bis 5 kurze Kernpunkte, nur wenn sie in den Reden vorkommen.
dissent_note ist nur gesetzt, wenn die Fraktion gemischt abstimmte oder eine Rede ausdrücklich von der Linie abwich.

Antworte nur als JSON passend zu diesem Schema:
{
  "position_summary": "5 bis 10 kurze deutsche Sätze",
  "key_points": ["kurzer Punkt", "kurzer Punkt"],
  "dissent_note": null
}

Eingabe:
${JSON.stringify(input, null, 2)}`
}
