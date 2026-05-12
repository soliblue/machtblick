import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getParty, type PartyVote } from '@/server/parties'
import { PartyDetail } from '@/views/partyDetail/PartyDetail'
import { seoMeta, canonicalLink, SITE_URL } from '@/lib/seo'
import { PARTY_LABEL, hasPartyLine } from '@/lib/parties'

type Result = 'angenommen' | 'abgelehnt'
const isResult = (v: unknown): v is Result => v === 'angenommen' || v === 'abgelehnt'
const VOTES: PartyVote[] = ['yes', 'no', 'abstain', 'split']
const isVote = (v: unknown): v is PartyVote => typeof v === 'string' && (VOTES as string[]).includes(v)

type Search = { result?: Result; vote?: PartyVote }

export const Route = createFileRoute('/parties/$id')({
  component: PartyDetailRoute,
  loader: ({ params }) => getParty({ data: params.id }),
  head: ({ loaderData, params }) => {
    const path = `/parties/${params.id}`
    const party = loaderData?.party
    const name = party ? (PARTY_LABEL[party] ?? party) : 'Fraktion'
    const showPartyLine = hasPartyLine(party)
    return {
      meta: seoMeta({
        title: name,
        description: showPartyLine
          ? `${name} im Deutschen Bundestag: Sitze, Geschlossenheit, Anträge, Mitglieder und Übereinstimmung mit anderen Fraktionen.`
          : `${name} im Deutschen Bundestag: Sitze, Mitglieder, Anwesenheit und Abstimmungen.`,
        canonical: path,
      }),
      links: canonicalLink(path),
      scripts: loaderData && showPartyLine
        ? [{
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'PoliticalParty',
              name: loaderData.party,
              numberOfEmployees: loaderData.seats,
              url: `${SITE_URL}${path}`,
              memberOf: { '@type': 'GovernmentOrganization', name: 'Deutscher Bundestag' },
            }),
          }]
        : [],
    }
  },
  validateSearch: (search: Record<string, unknown>): Search => ({
    result: isResult(search.result) ? search.result : undefined,
    vote: isVote(search.vote) ? search.vote : undefined,
  }),
})

function PartyDetailRoute() {
  const data = Route.useLoaderData()
  const { result, vote } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  return (
    <PartyDetail
      data={data}
      result={result ?? null}
      onResultChange={(v) => navigate({ search: (s) => ({ ...s, result: v ?? undefined }) })}
      partyVote={vote ?? null}
      onPartyVoteChange={(v) => navigate({ search: (s) => ({ ...s, vote: v ?? undefined }) })}
    />
  )
}
