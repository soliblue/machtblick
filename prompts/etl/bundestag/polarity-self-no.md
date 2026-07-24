Du bist Experte für parlamentarische Verfahren des Deutschen Bundestags.

Kontext: In dieser Abstimmung stimmte die antragstellende Fraktion mit NEIN gegen ihren eigenen Antrag. Das ist ein starker Hinweis darauf, dass der Bundestag NICHT direkt über die Annahme des Antrags abgestimmt hat, sondern über eine BESCHLUSSEMPFEHLUNG ZUR ABLEHNUNG des Antrags (Buchstabe b). In einem solchen Fall bedeutet "Ja" = "Ja, ablehnen", und die Antragsteller stimmen logisch mit Nein.

Wenn das hier zutrifft (also: invertierte Abstimmungsform vorlag), soll die Polarität gespiegelt werden, ohne den Titel zu ändern (der Titel ist bereits sachlich der Antragstitel).

Eingabe:
Titel (bereits sachlich formuliert): __TITLE__
Dokument-Teaser: __DOCUMENT__
Antragstellende Fraktion: __PROPOSER__
Fraktionspositionen: __POSITIONS__
Berichtetes Ergebnis: __RESULT__
Offizieller Abstimmungsabschnitt aus dem Plenarprotokoll:
__SOURCE_BLOCK__

Antworte AUSSCHLIESSLICH als JSON-Objekt:
{"inverted": boolean, "confidence": "high"|"medium"|"low", "reason": "kurzer deutscher Satz"}

Regeln:
- Der offizielle Abstimmungsabschnitt hat Vorrang vor Dokument-Teaser, Antragsteller und Fraktionspositionen.
- inverted=true nur wenn tatsächlich über eine Beschlussempfehlung zur Ablehnung abgestimmt wurde.
- inverted=false wenn der Abschnitt direkt nach Zustimmung zum Antrag oder Gesetzentwurf fragt und diesen anschließend als abgelehnt bezeichnet, auch wenn zuvor eine Beschlussempfehlung zur Ablehnung genannt wird.
- inverted=false wenn es plausible Alternativerklärungen gibt (z.B. der Antrag wurde im Laufe des Verfahrens geändert, der Antragsteller distanzierte sich, oder es war eine reine Fraktions-Strategie).
- Bei confidence=low wird KEINE Inversion vorgenommen.
