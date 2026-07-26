import { createServerFn } from '@tanstack/react-start'
import { readBerlinCoverage } from '@machtblick/berlin-db/client'
import type { BerlinCoverage } from '@machtblick/berlin-db/types'

export type ElectionGuideData = BerlinCoverage

export const getBerlinElectionGuide = createServerFn({ method: 'GET' })
  .handler(async (): Promise<ElectionGuideData> => readBerlinCoverage())
