import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { readBerlinProgrammeDocument } from '@machtblick/berlin-db/client'
import type { BerlinProgrammeDocumentDetail } from '@machtblick/berlin-db/types'

export type DocumentDetailData = BerlinProgrammeDocumentDetail

export const getBerlinDocument = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data }): Promise<DocumentDetailData> => {
    const detail = readBerlinProgrammeDocument(data)
    if (!detail) throw notFound()
    return detail
  })
