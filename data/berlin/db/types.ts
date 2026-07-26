export type ListType = 'landesliste' | 'bezirksliste'
export type CandidacyType = ListType | 'wahlkreis'
export type ProgrammeStatus = 'current_2026' | 'draft_2026' | 'campaign_material' | 'general' | 'missing'
export type CandidateCoverage = 'complete_list' | 'district_hub' | 'partial' | 'fragmented' | 'missing'
export type CandidateSourceStatus = 'party_published' | 'officially_admitted'
export type CandidatePortraitStatus = 'licensed' | 'official_source'
export type BerlinSourceKind = 'candidate_list' | 'candidate_profile' | 'candidate_portrait' | 'programme' | 'programme_document' | 'admission' | 'official_candidate_publication' | 'election_information'
export type ProgrammeCategory = 'wohnen' | 'mobilitaet' | 'klima-umwelt' | 'bildung' | 'wirtschaft-arbeit' | 'soziales-gesundheit' | 'sicherheit-migration' | 'verwaltung-demokratie' | 'vielfalt-teilhabe' | 'frieden' | 'kultur' | 'tierschutz'

export type BerlinParty = {
  slug: string
  name: string
  shortName: string
  listType: ListType
  listScope: string
  programmeStatus: ProgrammeStatus
  programmeUrl: string | null
  candidateCoverage: CandidateCoverage
  candidateUrl: string | null
  color: string
}

export type BerlinCandidate = {
  slug: string
  name: string
  partySlug: string
  partyShortName: string
  partyColor: string
  candidacyType: CandidacyType
  listPosition: number | null
  district: string | null
  constituency: number | null
  sourceStatus: CandidateSourceStatus
  sourceUrl: string
}

export type BerlinCandidateListItem = BerlinCandidate & {
  districts: string[]
  constituencies: { district: string; number: number }[]
  candidacies: {
    type: CandidacyType
    listPosition: number | null
    district: string | null
    constituency: number | null
  }[]
  occupation: string | null
  birthYear: number | null
  biographySummary: string | null
  priorities: string[]
  portraitUrl: string | null
  sourceCount: number
}

export type BerlinCandidacy = {
  type: CandidacyType
  listPosition: number | null
  district: string | null
  constituency: number | null
  sourceUrl: string
}

export type BerlinCandidateProfile = {
  occupation: string | null
  birthYear: number | null
  biographySummary: string | null
  priorities: string[]
  retrievedAt: string
}

export type BerlinCandidatePortrait = {
  imageUrl: string
  sourceUrl: string
  publisher: string
  author: string | null
  license: string | null
  licenseUrl: string | null
  status: CandidatePortraitStatus
  provenance: string
  retrievedAt: string
}

export type BerlinCandidateLink = {
  kind: string
  label: string
  url: string
}

export type BerlinSource = {
  id: string
  kind: BerlinSourceKind
  url: string
  title: string
  publisher: string
  publicationDate: string | null
  retrievedAt: string
}

export type BerlinCandidateDetail = {
  candidate: BerlinCandidate
  party: BerlinParty
  candidacies: BerlinCandidacy[]
  profile: BerlinCandidateProfile | null
  portrait: BerlinCandidatePortrait | null
  links: BerlinCandidateLink[]
  sources: BerlinSource[]
}

export type BerlinProgramme = {
  partySlug: string
  status: ProgrammeStatus
  title: string
  publicationDate: string | null
  summary: string
  sourceUrl: string
  retrievedAt: string
}

export type BerlinProgrammeListItem = BerlinProgramme & {
  partyName: string
  partyShortName: string
  partyColor: string
  topicCount: number
  documentCount: number
}

export type BerlinProgrammeTopic = {
  slug: string
  title: string
  summary: string
  positions: string[]
  categories: ProgrammeCategory[]
  sourceUrl: string
}

export type BerlinTopicComparison = BerlinProgrammeTopic & {
  category: ProgrammeCategory
  partySlug: string
  partyName: string
  partyShortName: string
  partyColor: string
  programmeTitle: string
  programmeStatus: ProgrammeStatus
}

export type BerlinProgrammeDocument = {
  id: string
  partySlug: string
  title: string
  url: string
  format: string
  publisher: string
  publicationDate: string | null
  kind: string
  embeddable: boolean
}

export type BerlinProgrammeDocumentIndexItem = Pick<BerlinProgrammeDocument, 'id' | 'partySlug' | 'title' | 'format' | 'kind'>

export type BerlinProgrammeDocumentDetail = {
  document: BerlinProgrammeDocument
  party: BerlinParty
  programme: BerlinProgramme
  sources: BerlinSource[]
}

export type BerlinProgrammeDetail = {
  party: BerlinParty
  programme: BerlinProgramme
  topics: BerlinProgrammeTopic[]
  documents: BerlinProgrammeDocument[]
  sources: BerlinSource[]
}

export type BerlinCatalog = {
  parties: BerlinParty[]
  candidates: BerlinCandidateListItem[]
  retrievedAt: string
  electionDate: string
  admissionSourceUrl: string
  candidatePublicationUrl: string
}

export type BerlinCoverage = {
  partyCount: number
  partyCandidateCount: number
  candidateCount: number
  candidacyCount: number
  biographyCount: number
  priorityCount: number
  portraitCount: number
  programmeCount: number
  currentProgrammeCount: number
  topicCount: number
  documentCount: number
}

export type BerlinCandidacyInput = {
  type: CandidacyType
  listPosition?: number | null
  district?: string | null
  constituency?: number | null
  sourceUrl: string
}

export type BerlinCandidateProfileInput = {
  slug: string
  name: string
  partySlug: string
  sourceUrl: string
  profileUrl?: string | null
  occupation?: string | null
  birthYear?: number | null
  district?: string | null
  constituency?: number | null
  biographySummary?: string | null
  priorities?: string[]
  website?: string | null
  email?: string | null
  socialLinks?: Record<string, string>
  retrievedAt: string
  candidacies?: BerlinCandidacyInput[]
}

export type BerlinCandidatePortraitInput = {
  candidateSlug: string
  imageUrl: string
  sourceUrl: string
  publisher: string
  author?: string
  license?: string
  licenseUrl?: string
  status: CandidatePortraitStatus
  provenance: string
  retrievedAt: string
}

export type BerlinProgrammeTopicInput = {
  slug: string
  title: string
  summary: string
  positions: string[]
  categories?: ProgrammeCategory[]
}

export type BerlinProgrammeDocumentInput = {
  title: string
  url: string
  format: string
  publisher: string
  publicationDate?: string | null
  kind: string
  embeddable?: boolean
}

export type BerlinProgrammeInput = {
  partySlug: string
  status: ProgrammeStatus
  title: string
  sourceUrl: string
  publicationDate?: string | null
  summary: string
  topics: BerlinProgrammeTopicInput[]
  documents?: BerlinProgrammeDocumentInput[]
  retrievedAt: string
}
