import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { readBerlinCandidateDetail, readBerlinProgrammeDetail } from '@machtblick/berlin-db/client'
import type { BerlinCandidateDetail, BerlinProgrammeTopic, BerlinSource, ProgrammeStatus } from '@machtblick/berlin-db/types'
import { resolvePortraitUrl } from './portraitManifest'

export type CandidateDetailData = BerlinCandidateDetail & {
  originalSource: Pick<BerlinSource, 'publisher' | 'url'>
  programme: {
    title: string
    status: ProgrammeStatus
    summary: string
    topicCount: number
    documentCount: number
    topics: BerlinProgrammeTopic[]
  } | null
}

export const getBerlinCandidate = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data }): Promise<CandidateDetailData> => {
    const detail = readBerlinCandidateDetail(data)
    if (!detail) throw notFound()
    const programme = readBerlinProgrammeDetail(detail.party.slug)
    const profileSource = detail.sources.find(({ kind }) => kind === 'candidate_profile')
      ?? detail.sources.find(({ kind }) => kind === 'candidate_list')
    return {
      ...detail,
      portrait: detail.portrait ? {
        ...detail.portrait,
        imageUrl: resolvePortraitUrl(detail.candidate.slug, detail.portrait.imageUrl)
      } : null,
      originalSource: {
        publisher: profileSource?.publisher ?? detail.party.name,
        url: profileSource?.url ?? detail.candidate.sourceUrl
      },
      programme: programme ? {
        title: programme.programme.title,
        status: programme.programme.status,
        summary: programme.programme.summary,
        topicCount: programme.topics.length,
        documentCount: programme.documents.length,
        topics: programme.topics
      } : null
    }
  })
