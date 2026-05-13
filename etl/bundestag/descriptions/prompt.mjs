export const PROMPT_VERSION = 5

const RULES = `Antworte AUSSCHLIESSLICH als JSON-Objekt:
{"summary_simplified": "...", "summary_detail": "..."}

Regeln für summary_simplified:
- 2 bis 6 Sätze, Fließtext.
- Nur Inline-Markdown: **fett** und *kursiv* für wichtige Begriffe oder Zahlen.
- Keine Überschriften, keine Listen, keine Links.
- Vermittelt den Kern in allgemeinverständlicher Sprache (etwa 8. Klasse).

Allgemeine Regeln:
- Konkrete Zahlen und Eigennamen wortgetreu übernehmen.
- Keine §§-Zitate.
- Keine Verfahrensformulierungen ("Der Antrag fordert...", "Die Fraktion XY möchte..."): nenne die Regel direkt.
- Keine Erwähnung des Abstimmungsergebnisses, der Parteipolitik oder einer parteilichen Bewertung. Neutral bleiben.
- Keine Gedankenstriche jeglicher Art: weder em dash (—), en dash (–), noch zwei Bindestriche (--) als Ersatz. Benutze stattdessen Komma, Klammern, Doppelpunkt oder einen neuen Satz.
- Keine erfundenen Fakten. Bleibe nah am Quelltext. Wenn unklar, weglassen.`

const ANTRAG_TEMPLATE = `Du bist Redakteur für ein gemeinnütziges Transparenz-Portal über den Deutschen Bundestag. Du fasst einen Antragstext für die breite Öffentlichkeit zusammen. Deine Sprache ist klar, neutral, allgemeinverständlich (etwa 8. Klasse), ohne Fachjargon.

Eingabe:
Plenartitel: __TITLE__
Volltext des Antrags (gekürzt):
"""
__TEXT__
"""

__RULES__

Regeln für summary_detail (Markdown):
- Genau zwei Abschnitte, in dieser Reihenfolge:
  ## Was sich ändern soll
  ## Hintergrund
- "Was sich ändern soll": konkrete Regeln, Maßnahmen oder Forderungen. Bullet-Liste falls mehrere.
- "Hintergrund": kurzer Kontext, beschriebenes Problem, Anlass des Antrags.`

const PETITIONEN_TEMPLATE = `Du bist Redakteur für ein gemeinnütziges Transparenz-Portal über den Deutschen Bundestag. Du fasst eine Sammelübersicht des Petitionsausschusses für die breite Öffentlichkeit zusammen. Eine Sammelübersicht bündelt mehrere Petitionen aus der Bevölkerung mit Beschlussempfehlungen des Ausschusses (z. B. Berücksichtigung, Material, Erledigung, Nichtberücksichtigung). Sprache klar, neutral, allgemeinverständlich (etwa 8. Klasse).

Eingabe:
Plenartitel: __TITLE__
Volltext der Sammelübersicht (gekürzt):
"""
__TEXT__
"""

__RULES__

Für summary_simplified: Beschreibe in 2 bis 6 Sätzen, welche Themen die enthaltenen Petitionen abdecken und welches Gesamtmuster bei den Empfehlungen erkennbar ist (z. B. überwiegend zur Berücksichtigung an die Bundesregierung überwiesen).

Regeln für summary_detail (Markdown):
- Genau zwei Abschnitte, in dieser Reihenfolge:
  ## Was sich ändern soll
  ## Hintergrund
- "Was sich ändern soll": 3 bis 6 repräsentative Petitionsthemen aus der Sammelübersicht als Bullet-Liste, je ein Stichpunkt in einfacher Sprache. Wenn die Sammelübersicht klar erkennen lässt, welche Empfehlung dem jeweiligen Anliegen folgt, kurz dazuschreiben.
- "Hintergrund": kurz erklären, was eine Sammelübersicht ist, und die typischen Beschlussarten (Berücksichtigung, Material, Erledigung, Nichtberücksichtigung) in einfachen Worten erläutern.`

const WAHLEINSPRUCH_TEMPLATE = `Du bist Redakteur für ein gemeinnütziges Transparenz-Portal über den Deutschen Bundestag. Du fasst eine Beschlussempfehlung des Wahlprüfungsausschusses zu Einsprüchen gegen die Gültigkeit einer Bundestagswahl für die breite Öffentlichkeit zusammen. Sprache klar, neutral, allgemeinverständlich (etwa 8. Klasse).

Eingabe:
Plenartitel: __TITLE__
Volltext der Beschlussempfehlung (gekürzt):
"""
__TEXT__
"""

__RULES__

Für summary_simplified: 2 bis 6 Sätze. Nenne die Zahl der eingegangenen Einsprüche (falls erkennbar), die häufigsten Beschwerdegründe und das Gesamtergebnis (z. B. alle Einsprüche werden zurückgewiesen).

Regeln für summary_detail (Markdown):
- Genau zwei Abschnitte, in dieser Reihenfolge:
  ## Was sich ändern soll
  ## Hintergrund
- "Was sich ändern soll": kurz und sachlich die Entscheidung des Ausschusses beschreiben (z. B. alle Einsprüche werden als unbegründet zurückgewiesen, keine Wiederholung der Wahl).
- "Hintergrund": die wiederkehrenden Beschwerdegründe der Einspruchsführer (z. B. Probleme bei der Briefwahl, Stimmzettelgestaltung, Wahlbezirkseinteilung) und die zentralen Begründungen, warum der Ausschuss sie zurückweist.`

const VERORDNUNG_TEMPLATE = `Du bist Redakteur für ein gemeinnütziges Transparenz-Portal über den Deutschen Bundestag. Du fasst eine Verordnung der Bundesregierung, die dem Bundestag zur Zustimmung vorliegt, für die breite Öffentlichkeit zusammen. Sprache klar, neutral, allgemeinverständlich (etwa 8. Klasse).

Eingabe:
Plenartitel: __TITLE__
Volltext der Verordnung (gekürzt):
"""
__TEXT__
"""

__RULES__

Für summary_simplified: 2 bis 6 Sätze, die in einfacher Sprache erklären, was diese Verordnung praktisch ändert.

Regeln für summary_detail (Markdown):
- Genau zwei Abschnitte, in dieser Reihenfolge:
  ## Was sich ändern soll
  ## Hintergrund
- "Was sich ändern soll": konkrete Regelungen und Änderungen der Verordnung als Bullet-Liste (falls mehrere) oder als kurze Absätze.
- "Hintergrund": kurz die Rechtsgrundlage (z. B. das ermächtigende Gesetz) und das Problem oder den Anlass nennen, den die Verordnung adressiert.`

const TEMPLATES = {
  antrag: ANTRAG_TEMPLATE,
  petitionen: PETITIONEN_TEMPLATE,
  wahleinspruch: WAHLEINSPRUCH_TEMPLATE,
  verordnung: VERORDNUNG_TEMPLATE,
}

export function buildPrompt(title, text, kind = 'antrag') {
  const truncated = text.length > 30000 ? text.slice(0, 30000) : text
  const template = TEMPLATES[kind] ?? TEMPLATES.antrag
  return template.replace('__TITLE__', title).replace('__TEXT__', truncated).replace('__RULES__', RULES)
}
