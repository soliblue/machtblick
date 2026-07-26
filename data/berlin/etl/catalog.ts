import type { BerlinCandidate, BerlinParty } from '@machtblick/berlin-db/types'
import { bswCandidates } from './candidates/bsw'
import { fdpCandidates } from './candidates/fdp'
import { grueneCandidates } from './candidates/gruene'
import { oedpCandidates } from './candidates/oedp'
import { pdfCandidates } from './candidates/pdf'
import { spdCandidates } from './candidates/spd'
import { tierschutzparteiCandidates } from './candidates/tierschutzpartei'
import { voltCandidates } from './candidates/volt'

export const parties: BerlinParty[] = [
  { slug: 'afd', name: 'Alternative für Deutschland', shortName: 'AfD', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'current_2026', programmeUrl: 'https://afd.berlin/abgeordnetenhauswahl/', candidateCoverage: 'fragmented', candidateUrl: 'https://afd.berlin/abgeordnetenhauswahl/', color: 'blue' },
  { slug: 'b', name: 'bergpartei, die überpartei', shortName: 'B*', listType: 'bezirksliste', listScope: 'Einzelne Bezirke', programmeStatus: 'missing', programmeUrl: null, candidateCoverage: 'missing', candidateUrl: null, color: 'orange' },
  { slug: 'gruene', name: 'BÜNDNIS 90/DIE GRÜNEN', shortName: 'GRÜNE', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'current_2026', programmeUrl: 'https://gruene.berlin/wahlprogramm', candidateCoverage: 'complete_list', candidateUrl: 'https://gruene.berlin/unsere-kandidatinnen-fuer-die-liste-zur-abgeordnetenhauswahl-2026', color: 'green' },
  { slug: 'bsw', name: 'Bündnis Sahra Wagenknecht', shortName: 'BSW', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'current_2026', programmeUrl: 'https://bsw.berlin/wp-content/uploads/Wahlprogramm-BSW-Berlin-AGH-Wahl-2026.pdf', candidateCoverage: 'complete_list', candidateUrl: 'https://bsw.berlin/allgemein/bsw-berlin-komplettiert-landesliste-fuer-die-abgeordnetenhauswahl-2026/', color: 'pink' },
  { slug: 'cdu', name: 'Christlich Demokratische Union Deutschlands', shortName: 'CDU', listType: 'bezirksliste', listScope: 'Alle Bezirke', programmeStatus: 'current_2026', programmeUrl: 'https://berlin-wird.de/image/uploads/data/regierungsprogramm2026_2031.pdf', candidateCoverage: 'fragmented', candidateUrl: null, color: 'gray' },
  { slug: 'dkp', name: 'Deutsche Kommunistische Partei', shortName: 'DKP', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'campaign_material', programmeUrl: 'https://berlin.dkp.de/dkp-bei-der-abgeordnetenhauswahl/', candidateCoverage: 'missing', candidateUrl: null, color: 'red' },
  { slug: 'heimat', name: 'Die Heimat', shortName: 'HEIMAT', listType: 'bezirksliste', listScope: 'Einzelne Bezirke', programmeStatus: 'general', programmeUrl: 'https://die-heimat.de/wp-content/uploads/2023/11/Parteiprogramm_Heimat.pdf', candidateCoverage: 'missing', candidateUrl: null, color: 'brown' },
  { slug: 'linke', name: 'Die Linke', shortName: 'Die Linke', listType: 'bezirksliste', listScope: 'Alle Bezirke', programmeStatus: 'current_2026', programmeUrl: 'https://dielinke.berlin/wahlprogramm/', candidateCoverage: 'district_hub', candidateUrl: 'https://dielinke.berlin/partei/wahlen/abgeordnetenhauswahlen-2026/', color: 'purple' },
  { slug: 'die-urbane', name: 'Die Urbane. Eine HipHop Partei', shortName: 'Die Urbane', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'campaign_material', programmeUrl: 'https://www.die-urbane.de/die-urbane/landesverbaende/du-berlin.html', candidateCoverage: 'missing', candidateUrl: null, color: 'rust' },
  { slug: 'fdp', name: 'Freie Demokratische Partei', shortName: 'FDP', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'current_2026', programmeUrl: 'https://www.fdp-berlin.de/beschluss/wahlprogramm-zur-abgeordnetenhauswahl-2026', candidateCoverage: 'complete_list', candidateUrl: 'https://www.fdp-berlin.de/ein-starkes-team-fuer-eine-stadt-die-wieder-funktioniert', color: 'yellow' },
  { slug: 'oedp', name: 'Ökologisch-Demokratische Partei', shortName: 'ÖDP', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'general', programmeUrl: 'https://www.oedp-berlin.de/fileadmin/user_upload/01-instanzen/02/030-Programm/Landesprogramm-Berlin.pdf', candidateCoverage: 'complete_list', candidateUrl: 'https://www.oedp-berlin.de/wahlen/abgeordnetenhauswahl-2026/landesliste', color: 'teal' },
  { slug: 'pdf', name: 'Partei des Fortschritts', shortName: 'PdF', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'missing', programmeUrl: null, candidateCoverage: 'complete_list', candidateUrl: 'https://partei-des-fortschritts.de/wahl-zum-abgeordnetenhaus-berlin/', color: 'indigo' },
  { slug: 'die-partei', name: 'Partei für Arbeit, Rechtsstaat, Tierschutz, Elitenförderung und basisdemokratische Initiative', shortName: 'Die PARTEI', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'current_2026', programmeUrl: 'https://die-partei-berlin.de/', candidateCoverage: 'missing', candidateUrl: null, color: 'gray' },
  { slug: 'tierschutzpartei', name: 'PARTEI MENSCH KLIMA TIERSCHUTZ', shortName: 'Tierschutzpartei', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'current_2026', programmeUrl: 'https://berlin.tierschutzpartei.de/wahlprogramm-berlin-2026.pdf', candidateCoverage: 'complete_list', candidateUrl: 'https://berlin.tierschutzpartei.de/berliner-wahlen-2026', color: 'mint' },
  { slug: 'spd', name: 'Sozialdemokratische Partei Deutschlands', shortName: 'SPD', listType: 'bezirksliste', listScope: 'Alle Bezirke', programmeStatus: 'current_2026', programmeUrl: 'https://spd.berlin/media/2026/06/SPD-Berlin_Wahlprogramm2026.pdf', candidateCoverage: 'complete_list', candidateUrl: 'https://spd.berlin/kandidatinnen/', color: 'red' },
  { slug: 'sgp', name: 'Sozialistische Gleichheitspartei, Vierte Internationale', shortName: 'SGP', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'campaign_material', programmeUrl: 'https://www.wsws.org/de/articles/2026/07/10/sgpb-j10.html', candidateCoverage: 'partial', candidateUrl: 'https://www.wsws.org/de/articles/2026/07/13/yziz-j13.html', color: 'rust' },
  { slug: 'volt', name: 'Volt Deutschland', shortName: 'Volt', listType: 'landesliste', listScope: 'Berlinweit', programmeStatus: 'current_2026', programmeUrl: 'https://voltdeutschland.org/berlin/programm/programme/programm-berlin-2026', candidateCoverage: 'complete_list', candidateUrl: 'https://voltdeutschland.org/berlin/neuigkeiten/volt-berlin-waehlt-landesliste-2026', color: 'purple' }
]

export const candidates: BerlinCandidate[] = [
  ...bswCandidates,
  ...fdpCandidates,
  ...grueneCandidates,
  ...oedpCandidates,
  ...pdfCandidates,
  ...spdCandidates,
  ...tierschutzparteiCandidates,
  ...voltCandidates
]
