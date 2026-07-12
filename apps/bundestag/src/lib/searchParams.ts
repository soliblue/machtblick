import { VOTE_FLAG_FILTERS, type VoteFlagFilter } from '@/hooks/useVoteFlags'
import type { VoteTypeFilter, VoteResultFilter } from '@/hooks/useVoteListFilters'
import type { AntragTypeFilter } from '@/hooks/useAntragListFilters'
import { MOTION_STATUS_BUCKETS, type MotionStatusBucket } from '@/lib/motionStatus'
import { isAgeBucket, isMandateType, isSex, type AgeBucket, type MandateType, type MemberSex } from '@/lib/memberFacets'

const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
const nonEmptyStr = (v: unknown) => (typeof v === 'string' && v ? v : undefined)
const oneOf = <T extends string>(values: readonly T[], v: unknown) => ((values as readonly string[]).includes(v as string) ? (v as T) : undefined)
const pastFirstPage = (v: unknown) => (typeof v === 'number' && v > 1 ? v : undefined)

const VOTE_TYPES: VoteTypeFilter[] = ['namentlich', 'handzeichen', 'hammelsprung']
const VOTE_RESULTS: VoteResultFilter[] = ['angenommen', 'abgelehnt']
const ANTRAG_TYPES: AntragTypeFilter[] = ['antrag', 'gesetzentwurf']

export type VotesSearch = { party?: string; type?: VoteTypeFilter; result?: VoteResultFilter; topic?: string; q?: string; flag?: VoteFlagFilter }

export const validateVotesSearch = (search: Record<string, unknown>): VotesSearch => ({
  party: str(search.party),
  type: oneOf(VOTE_TYPES, search.type),
  result: oneOf(VOTE_RESULTS, search.result),
  topic: str(search.topic),
  q: str(search.q),
  flag: oneOf(VOTE_FLAG_FILTERS, search.flag),
})

export type MotionsSearch = { type?: AntragTypeFilter; party?: string; status?: MotionStatusBucket; page?: number }

export const validateMotionsSearch = (search: Record<string, unknown>): MotionsSearch => ({
  type: oneOf(ANTRAG_TYPES, search.type),
  party: nonEmptyStr(search.party),
  status: oneOf(MOTION_STATUS_BUCKETS, search.status),
  page: pastFirstPage(search.page),
})

export type MembersSearch = {
  party?: string
  state?: string
  sex?: MemberSex
  age?: AgeBucket
  mandate?: MandateType
  q?: string
}

export const validateMembersSearch = (search: Record<string, unknown>): MembersSearch => ({
  party: str(search.party),
  state: str(search.state),
  sex: isSex(search.sex) ? search.sex : undefined,
  age: isAgeBucket(search.age) ? search.age : undefined,
  mandate: isMandateType(search.mandate) ? search.mandate : undefined,
  q: str(search.q),
})

export type SpeechesSearch = { q?: string; party?: string; date?: string; memberId?: string; page?: number }

export const validateSpeechesSearch = (search: Record<string, unknown>): SpeechesSearch => ({
  q: nonEmptyStr(search.q),
  party: nonEmptyStr(search.party),
  date: nonEmptyStr(search.date),
  memberId: nonEmptyStr(search.memberId),
  page: pastFirstPage(search.page),
})

export const speechesLoaderDeps = ({ search }: { search: SpeechesSearch }) => ({
  q: search.q ?? '',
  party: search.party ?? '',
  date: search.date ?? '',
  memberId: search.memberId ?? '',
  page: (search.page ?? 1) - 1,
})

export type MemberLineSearch = { line?: 'abw' }

export const validateMemberLineSearch = (search: Record<string, unknown>): MemberLineSearch => ({
  line: search.line === 'abw' ? 'abw' : undefined,
})
