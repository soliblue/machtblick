import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const SUMMARIES = [
  ['pp21-89-17-zuruckverweisung-der-verordnung-zur-umsetzung-der-richtlinie-eu-2024-1785', 'Abstimmung über die Zurückverweisung der Verordnung zur Umsetzung der Richtlinie (EU) 2024/1785 (Drucksache 21/5875) an den Ausschuss.'],
  ['pp21-89-18-stellungnahme-im-verfahren-2-bvq-47-26', 'Abstimmung über die Abgabe einer Stellungnahme des Bundestages im Verfahren 2 BvQ 47/26 vor dem Bundesverfassungsgericht (Drucksache 21/6989).'],
  ['pp21-89-26-afd-wahlvorschlag-fur-den-stiftungsrat-der-bundesstiftung-baukultur', 'Abstimmung über den Wahlvorschlag der AfD-Fraktion für den Stiftungsrat der Bundesstiftung Baukultur (Drucksache 21/6888).'],
  ['pp21-89-27-grunen-wahlvorschlag-fur-den-stiftungsrat-der-bundesstiftung-baukultur', 'Abstimmung über den Wahlvorschlag der Fraktion Bündnis 90/Die Grünen für den Stiftungsrat der Bundesstiftung Baukultur (Drucksache 21/6889).'],
  ['pp21-89-28-grunen-wahlvorschlage-fur-den-stiftungsrat-zur-aufarbeitung-der-sed-diktatur', 'Abstimmung über die Wahlvorschläge der Fraktion Bündnis 90/Die Grünen für den Stiftungsrat der Bundesstiftung zur Aufarbeitung der SED-Diktatur (Drucksache 21/6894).'],
]

const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)))
const fill = db.prepare('UPDATE votes SET summary_simplified = ? WHERE id = ? AND summary_simplified IS NULL')
let changed = 0
for (const [id, summary] of SUMMARIES) changed += fill.run(summary, id).changes
db.close()

console.log(`personnel vote summaries filled: ${changed}/${SUMMARIES.length}`)
