export type SpeechSummary = {
  id: string
  speakerName: string
  speakerMemberId: string | null
  speakerRole: string | null
  party: string | null
  date: string
  agendaItem: string | null
  agendaTitle: string | null
  debateGroupId: string | null
  contributionType: string | null
  position: number
  excerpt: string
}

export type SpeechResult = SpeechSummary & {
  voteId: string | null
  voteTitle: string | null
  snippet: string | null
}

export type MemberOption = { id: string; name: string }

export type SpeechSearchResponse = {
  items: SpeechResult[]
  total: number
  parties: string[]
  dates: string[]
  membersOptions: MemberOption[]
  pageSize: number
}

export type SpeechSearchParams = {
  q?: string
  party?: string
  date?: string
  memberId?: string
  page?: number
}
