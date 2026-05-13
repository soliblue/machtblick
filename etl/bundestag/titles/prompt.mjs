export const PROMPT_VERSION = 3

const TEMPLATE = `Du bist Redakteur für ein gemeinnütziges Transparenz-Portal über den Deutschen Bundestag. Du verbesserst nichtssagende offizielle Plenartitel zu kurzen, sachlichen Überschriften, die den Gegenstand der Abstimmung direkt benennen.

Eingabe:
Offizieller Plenartitel: __TITLE__
Zugrundeliegender Drucksachentitel: __DRUCKSACHE_TITLE__
Inhaltliche Zusammenfassung: __SUMMARY__

Antworte AUSSCHLIESSLICH als JSON-Objekt, ohne Erklärung davor oder danach:
{"clean_title": "string|null", "confidence": "high"|"medium"|"low"}

Regeln für clean_title:
- Höchstens 80 Zeichen.
- Beginnt mit Großbuchstabe.
- Benennt das Sachthema direkt (z. B. "Steuerliche Förderung von E-Autos für Pflegedienste").
- KEINE Fraktionsnamen (CDU, CSU, CDU/CSU, SPD, AfD, Bündnis 90/Die Grünen, Grüne, Die Linke, Linke, FDP, BSW). Antragsteller werden separat angezeigt.
- KEINE Drucksachen-Referenzen ("Drucksache 21/5808", "zu Drs. ..."): die Drucksache wird separat verlinkt.
- KEINE Verfahrensrahmung am Anfang: kein "Antrag der ...", kein "Entschließungsantrag zu ...", kein "Beschlussempfehlung ...". Direkt den Inhalt nennen.
- Neutral und allgemeinverständlich. Keine parteiliche Bewertung, keine Wertung.
- Keine Gedankenstriche jeglicher Art (kein em dash, kein en dash, kein doppelter Bindestrich). Stattdessen Komma, Doppelpunkt, Klammer oder neuer Satz.
- Keine Anführungszeichen rund um den Titel.
- Wenn der Antrag sich gegen ein bestehendes oder geplantes Gesetz/Vorhaben richtet: formuliere als "Gegen X" oder "Gegen X, Forderung nach Y". NICHT "Ablehnung von X" verwenden (klingt nach Abstimmungsergebnis statt nach Inhalt).

Wann clean_title=null:
- Wenn der offizielle Plenartitel bereits eine gute, sachthemen-orientierte Überschrift ist (z. B. "Haushaltsgesetz 2025", "Doppelbesteuerungsabkommen Schweiz und Niederlande"). In diesem Fall confidence=high.
- Wenn das Sachthema aus den Eingaben nicht klar erkennbar ist. confidence=low.

confidence:
- high: Sachthema ist eindeutig erkennbar, Überschrift sitzt sauber.
- medium: Sachthema ist erkennbar, aber Formulierung enthält Restunsicherheit.
- low: unklar. Bei low wird NICHT geschrieben.`

const SAMMEL_TEMPLATE = `Du bist Redakteur für ein gemeinnütziges Transparenz-Portal über den Deutschen Bundestag. Du formulierst die Themenliste einer Petitions-Sammelübersicht in eine kurze, sachliche Themenphrase um.

Eingabe:
Offizieller Plenartitel: __TITLE__
Zugrundeliegender Drucksachentitel: __DRUCKSACHE_TITLE__
Inhaltliche Zusammenfassung: __SUMMARY__

Antworte AUSSCHLIESSLICH als JSON-Objekt, ohne Erklärung davor oder danach:
{"clean_title": "string|null", "confidence": "high"|"medium"|"low"}

Regeln für clean_title (NUR die Themenphrase, nicht der vollständige Titel):
- Höchstens 55 Zeichen.
- Beginnt mit "Petitionen zu " gefolgt von 2 bis 4 Themen, verbunden mit Komma und am Ende mit "und".
- Beispiel: "Petitionen zu Verkehr, Bürgergeld und Krankenversicherung".
- Kurze, alltagsverständliche Themenbezeichnungen (z. B. "Mietrecht", "Bürgergeld", "Pflege"), keine Behördennamen, keine Aktenzeichen.
- KEINE Nummer ("Sammelübersicht 230", "Nr. 230") in der Antwort.
- KEINE Anzahl ("31 Petitionen", "Abschluss von 17 Petitionen"). Die Antwort beschreibt die Themen, nicht den Vorgang.
- KEINE Fraktionsnamen, keine Drucksachen-Referenzen, keine Verfahrensrahmung.
- KEINE parteiliche Bewertung. Neutral und allgemeinverständlich.
- Keine Gedankenstriche jeglicher Art. Keine Anführungszeichen.

Wann clean_title=null:
- Wenn aus den Eingaben keine konkreten Themen erkennbar sind. confidence=low.

confidence:
- high: Themen sind eindeutig benannt.
- medium: Themen sind erkennbar, Formulierung enthält Restunsicherheit.
- low: unklar. Bei low wird NICHT geschrieben.`

export function buildPrompt({ title, summary, drucksacheTitle, isSammelubersicht = false }) {
  const tpl = isSammelubersicht ? SAMMEL_TEMPLATE : TEMPLATE
  return tpl
    .replace('__TITLE__', title)
    .replace('__DRUCKSACHE_TITLE__', drucksacheTitle ?? '(nicht vorhanden)')
    .replace('__SUMMARY__', summary ?? '(nicht vorhanden)')
}
