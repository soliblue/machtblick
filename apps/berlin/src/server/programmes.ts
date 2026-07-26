import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { readBerlinProgrammeDetail, readBerlinProgrammes } from '@machtblick/berlin-db/client'
import type { BerlinProgrammeDetail, BerlinProgrammeListItem } from '@machtblick/berlin-db/types'

export type ProgrammeItem = BerlinProgrammeListItem
export type ProgrammeDetailData = BerlinProgrammeDetail

export const getBerlinProgrammes = createServerFn({ method: 'GET' })
  .handler(async (): Promise<ProgrammeItem[]> => readBerlinProgrammes())

export const getBerlinProgramme = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data }): Promise<ProgrammeDetailData> => {
    const detail = readBerlinProgrammeDetail(data)
    if (!detail) throw notFound()
    return detail
  })
