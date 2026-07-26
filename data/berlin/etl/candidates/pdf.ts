import { landesliste } from './createCandidates'

export const pdfCandidates = landesliste(
  'pdf',
  'https://partei-des-fortschritts.de/wahl-zum-abgeordnetenhaus-berlin/',
  [
    'Aimee Kühn',
    'Salem Rezik',
    'Babak Rohani',
    'Patrick Lieckfeldt',
    'Benjamin Helling',
    'Marco Seeling',
    'Sven Xavier Niles'
  ]
)
