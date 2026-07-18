import type { getVote } from '@/server/voteDetail'
import type { getVoteSponsors } from '@/server/voteSponsors'
import type { getMember } from '@/server/memberDetail'
import type { getParty } from '@/server/partyDetail'
import type { getPartyHistory } from '@/server/getPartyHistory'
import type { getAntrag } from '@/server/antraege'
import { seoMeta, canonicalLink, alternateJsonLink, breadcrumbJsonLd, jsonLd, plainDescription, SITE_URL } from '@/lib/seo'
import { formatDateLong, pct } from '@/lib/format'
import { hasPartyLine, partyLabel, PARTY_SLUG } from '@/lib/parties'
import { motionStatusBucket } from '@/lib/motionStatus'
import { copy } from '@/lib/i18n'
import { withLocale, type Locale } from '@/lib/locale'

type Params = { id: string }
type VoteDetailData = Awaited<ReturnType<typeof getVote>> & { sponsors: Awaited<ReturnType<typeof getVoteSponsors>> }
type MemberDetailData = Awaited<ReturnType<typeof getMember>>
type PartyDetailData = { detail: Awaited<ReturnType<typeof getParty>>; history: Awaited<ReturnType<typeof getPartyHistory>> }
type MotionDetailData = Awaited<ReturnType<typeof getAntrag>>

export function voteDetailHead(loaderData: VoteDetailData | undefined, params: Params, locale: Locale) {
  const en = locale === 'en'
  const path = withLocale(`/votes/${params.id}`, locale)
  const v = loaderData?.vote
  const headline = v?.cleanTitle ?? null
  const namentlich = v?.voteType === 'namentlich'
  const title = v && headline
    ? namentlich ? (en ? `${headline}: ${v.yes} to ${v.no}` : `${headline}: ${v.yes} zu ${v.no}`) : headline
    : en ? 'Vote' : 'Abstimmung'
  const result = en
    ? v?.result === 'angenommen' ? 'Passed' : v?.result === 'abgelehnt' ? 'Rejected' : 'Decided'
    : v ? `${v.result.charAt(0).toUpperCase()}${v.result.slice(1)}` : ''
  const lead = v && headline
    ? namentlich
      ? en ? `${result} ${v.yes} to ${v.no}: ${headline}.` : `${result} mit ${v.yes} zu ${v.no} Stimmen: ${headline}.`
      : `${result}: ${headline}.`
    : en ? 'Vote in the German Bundestag.' : 'Namentliche Abstimmung im Deutschen Bundestag.'
  const core = v && headline
    ? en
      ? `${lead} ${namentlich ? 'Roll-call vote in the German Bundestag' : 'Bundestag vote'} on ${formatDateLong(v.date, 'en')}.`
      : `${lead} ${namentlich ? 'Namentliche Abstimmung' : 'Abstimmung'} im Bundestag am ${formatDateLong(v.date)}.`
    : lead
  const full = v && headline
    ? `${core} ${en ? 'Sponsor' : 'Antragsteller'}: ${loaderData?.proposingParty ?? (en ? 'unknown' : 'unbekannt')}.`
    : lead
  const stanceWords = en
    ? ({ yes: 'In favour', no: 'Against', abstain: 'Abstained' } as const)
    : ({ yes: 'Dafür', no: 'Dagegen', abstain: 'Enthalten' } as const)
  const stances = !namentlich && loaderData
    ? (['yes', 'no', 'abstain'] as const)
        .map((pos) => [pos, loaderData.partySummaries.filter((s) => s.position === pos).map((s) => partyLabel(s.party, locale))] as const)
        .filter(([, parties]) => parties.length)
        .map(([pos, parties]) => `${stanceWords[pos]}: ${parties.join(', ')}`)
        .join('. ')
    : ''
  const desc = (stances ? [`${full} ${stances}.`, `${core} ${stances}.`, full, core, lead] : [full, core, lead]).find((c) => c.length <= 160) ?? lead
  const ogImage = namentlich
    ? {
        image: `/og/votes/${params.id}.png`,
        imageAlt: en ? `Bundestag vote result: ${headline ?? 'Vote'}` : `Abstimmungsergebnis im Bundestag: ${headline ?? 'Abstimmung'}`,
      }
    : {}
  return {
    meta: [
      ...seoMeta({ title, description: desc, canonical: path, type: 'article' as const, ...ogImage }),
      ...(v ? [{ property: 'article:published_time', content: v.date }] : []),
    ],
    links: [...canonicalLink(path), ...alternateJsonLink(path)],
    scripts: [
      ...breadcrumbJsonLd([
        { name: copy[locale].navVotes, path: withLocale('/votes', locale) },
        { name: headline ?? (en ? 'Vote' : 'Abstimmung'), path },
      ]),
      ...(v && headline
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Event',
            '@id': `${SITE_URL}${path}/`,
            name: headline,
            startDate: v.date,
            location: { '@type': 'Place', name: 'Deutscher Bundestag', address: { '@type': 'PostalAddress', addressLocality: 'Berlin', addressCountry: 'DE' } },
            organizer: { '@type': 'GovernmentOrganization', name: en ? 'German Bundestag' : 'Deutscher Bundestag' },
            url: `${SITE_URL}${path}/`,
            description: v.voteType === 'namentlich'
              ? en
                ? `Roll-call vote on ${formatDateLong(v.date, 'en')}: ${result.toLowerCase()}. ${v.yes} yes, ${v.no} no, ${v.abstain} abstentions, ${v.absent} not cast.`
                : `Namentliche Abstimmung am ${formatDateLong(v.date)}: ${v.result}. ${v.yes} Ja, ${v.no} Nein, ${v.abstain} Enthaltungen, ${v.absent} nicht abgegeben.`
              : en
                ? `Vote on ${formatDateLong(v.date, 'en')}: ${result.toLowerCase()}.`
                : `Abstimmung am ${formatDateLong(v.date)}: ${v.result}.`,
            ...(loaderData?.sponsors.antraege.length && loaderData.sponsors.antraege.length <= 3
              ? {
                  about: loaderData.sponsors.antraege.map((a) => ({
                    '@type': 'Legislation',
                    name: a.title,
                    url: `${SITE_URL}${withLocale(`/motions/${a.antragId}`, locale)}/`,
                    ...(a.drucksache ? { legislationIdentifier: a.drucksache } : {}),
                  })),
                }
              : {}),
          })
        : []),
    ],
  }
}

export function memberDetailHead(loaderData: MemberDetailData | undefined, params: Params, locale: Locale) {
  const en = locale === 'en'
  const path = withLocale(`/members/${params.id}`, locale)
  const name = loaderData?.name ?? (en ? 'Member' : 'Abgeordnete:r')
  const who = loaderData ? `${name} (${[loaderData.party, loaderData.state].filter(Boolean).join(', ')})` : name
  return {
    meta: seoMeta({
      title: loaderData
        ? en ? `${name} (${loaderData.party}): Voting record` : `${name} (${loaderData.party}): Abstimmungsverhalten`
        : name,
      description: loaderData
        ? loaderData.loyalty !== null
          ? en
            ? `${who} in the German Bundestag: ${pct(loaderData.attendance)} attendance and ${pct(loaderData.loyalty)} party-line loyalty in roll-call votes.`
            : `${who} im Bundestag: ${pct(loaderData.attendance)} Anwesenheit und ${pct(loaderData.loyalty)} Linientreue bei namentlichen Abstimmungen.`
          : en
            ? `${who} in the German Bundestag: ${pct(loaderData.attendance)} attendance in roll-call votes, plus speeches.`
            : `${who} im Bundestag: ${pct(loaderData.attendance)} Anwesenheit bei namentlichen Abstimmungen. Reden im Überblick.`
        : en
          ? 'Voting record, attendance, and party-line voting in the German Bundestag.'
          : 'Abstimmungsverhalten, Anwesenheit und Linientreue im Deutschen Bundestag.',
      canonical: path,
      type: 'profile',
    }),
    links: [...canonicalLink(path), ...alternateJsonLink(path)],
    scripts: [
      ...breadcrumbJsonLd([
        { name: copy[locale].navMembers, path: withLocale('/members', locale) },
        { name, path },
      ]),
      ...(loaderData
      ? jsonLd({
          '@context': 'https://schema.org',
          '@type': 'Person',
          '@id': `${SITE_URL}${path}/`,
          name: loaderData.name,
          jobTitle: en ? 'Member of the German Bundestag' : 'Mitglied des Deutschen Bundestages',
          worksFor: { '@type': 'GovernmentOrganization', name: en ? 'German Bundestag' : 'Deutscher Bundestag' },
          memberOf: {
            '@type': hasPartyLine(loaderData.party) ? 'PoliticalParty' : 'Organization',
            name: loaderData.party,
            ...(PARTY_SLUG[loaderData.party] ? { url: `${SITE_URL}${withLocale(`/parties/${PARTY_SLUG[loaderData.party]}`, locale)}/` } : {}),
          },
          ...(loaderData.state
            ? {
                homeLocation: { '@type': 'AdministrativeArea', name: loaderData.state },
                address: { '@type': 'PostalAddress', addressRegion: loaderData.state, addressCountry: 'DE' },
              }
            : {}),
          url: `${SITE_URL}${path}/`,
          ...(loaderData.pictureUrl ? { image: loaderData.pictureUrl } : {}),
          ...(loaderData.sameAs?.length ? { sameAs: loaderData.sameAs } : {}),
        })
      : []),
    ],
  }
}

export function partyDetailHead(loaderData: PartyDetailData | undefined, params: Params, locale: Locale) {
  const en = locale === 'en'
  const path = withLocale(`/parties/${params.id}`, locale)
  const detail = loaderData?.detail
  const party = detail?.party
  const name = party ? partyLabel(party, locale) : en ? 'Party' : 'Fraktion'
  const showPartyLine = hasPartyLine(party)
  const ogImage = ['cdu-csu', 'spd', 'afd', 'gruene', 'linke'].includes(params.id)
    ? {
        image: `/og/parties/${params.id}.png`,
        imageAlt: en
          ? `${name} in the Bundestag: seats and share of the parliamentary group.`
          : `${name} im Bundestag: Sitze und Anteil der Fraktion.`,
      }
    : {}
  return {
    meta: seoMeta({
      title: en ? `${name} in the Bundestag: Voting record` : `${name} im Bundestag: Abstimmungsverhalten`,
      description: showPartyLine
        ? en
          ? `${name} in the German Bundestag${detail ? ` with ${detail.seats} seats` : ''}: cohesion, defectors, motions, members, and agreement with other parliamentary groups.`
          : `${name} im Deutschen Bundestag${detail ? ` mit ${detail.seats} Sitzen` : ''}: Geschlossenheit, Abweichler, Anträge, Mitglieder und Übereinstimmung mit anderen Fraktionen.`
        : en
          ? `${name} in the German Bundestag${detail ? ` with ${detail.seats} seats` : ''}: members, attendance, and voting behavior in roll-call votes.`
          : `${name} im Deutschen Bundestag${detail ? ` mit ${detail.seats} Sitzen` : ''}: Mitglieder, Anwesenheit und Abstimmungsverhalten bei namentlichen Abstimmungen.`,
      canonical: path,
      ...ogImage,
    }),
    links: [...canonicalLink(path), ...alternateJsonLink(path)],
    scripts: [
      ...breadcrumbJsonLd([
        { name: copy[locale].navParties, path: withLocale('/parties', locale) },
        { name, path },
      ]),
      ...(detail
      ? jsonLd({
          '@context': 'https://schema.org',
          '@type': showPartyLine ? 'PoliticalParty' : 'Organization',
          '@id': `${SITE_URL}${path}/`,
          name: partyLabel(detail.party, locale),
          numberOfEmployees: { '@type': 'QuantitativeValue', value: detail.seats },
          url: `${SITE_URL}${path}/`,
          memberOf: { '@type': 'GovernmentOrganization', name: en ? 'German Bundestag' : 'Deutscher Bundestag' },
          member: detail.members.map((m) => ({
            '@type': 'Person',
            '@id': `${SITE_URL}${withLocale(`/members/${m.id}`, locale)}/`,
            name: m.name,
            url: `${SITE_URL}${withLocale(`/members/${m.id}`, locale)}/`,
          })),
        })
      : []),
    ],
  }
}

export function motionDetailHead(loaderData: MotionDetailData | undefined, params: Params, locale: Locale) {
  const en = locale === 'en'
  const path = withLocale(`/motions/${params.id}`, locale)
  const a = loaderData?.antrag
  const name = a?.cleanTitle ?? a?.title ?? (en ? 'Motion' : 'Antrag')
  const bucket = motionStatusBucket(a?.beratungsstand ?? null)
  const status = (en
    ? { angenommen: 'adopted', abgelehnt: 'rejected', 'im-verfahren': 'in progress', 'nicht-beraten': 'not yet debated' }
    : { angenommen: 'angenommen', abgelehnt: 'abgelehnt', 'im-verfahren': 'im Verfahren', 'nicht-beraten': 'noch nicht beraten' })[bucket]
  const title = bucket === 'angenommen' || bucket === 'abgelehnt' ? `${name}: ${status}` : name
  const summary = plainDescription(a?.summarySimplified ?? a?.abstract ?? (en ? 'Motion in the German Bundestag.' : 'Antrag im Deutschen Bundestag.'))
  const dated = en
    ? `${a?.type === 'gesetzentwurf' ? 'Bill' : 'Motion'}${a?.introducedDate ? ` introduced ${formatDateLong(a.introducedDate, 'en')}` : ''}`
    : `${a?.type === 'gesetzentwurf' ? 'Gesetzentwurf' : 'Antrag'}${a?.introducedDate ? ` vom ${formatDateLong(a.introducedDate)}` : ''}`
  const desc = a
    ? [
        `${summary} ${dated}${a.initiativeFraktion ? ` (${a.initiativeFraktion})` : ''}, ${en ? 'status' : 'Status'}: ${status}.`,
        `${summary} ${dated}, ${en ? 'status' : 'Status'}: ${status}.`,
        summary,
      ].find((c) => c.length <= 165) ?? summary
    : summary
  const modified = loaderData ? [loaderData.antrag.introducedDate, ...loaderData.linkedVotes.map((v) => v.date)].filter((d): d is string => Boolean(d)).sort().pop() : undefined
  return {
    meta: seoMeta({ title, description: desc, canonical: path, type: 'article' }),
    links: [...canonicalLink(path), ...alternateJsonLink(path)],
    scripts: [
      ...breadcrumbJsonLd([
        { name: copy[locale].navMotions, path: withLocale('/motions', locale) },
        { name, path },
      ]),
      ...(loaderData
      ? jsonLd({
          '@context': 'https://schema.org',
          '@type': 'Legislation',
          name,
          legislationType: loaderData.antrag.type === 'gesetzentwurf' ? 'Gesetzentwurf' : 'Antrag',
          inLanguage: en ? 'en' : 'de',
          url: `${SITE_URL}${path}/`,
          ...(loaderData.antrag.drucksache ? { legislationIdentifier: loaderData.antrag.drucksache } : {}),
          ...(loaderData.antrag.introducedDate ? { legislationDate: loaderData.antrag.introducedDate, datePublished: loaderData.antrag.introducedDate } : {}),
          ...(modified ? { dateModified: modified } : {}),
          ...(loaderData.antrag.abstract ? { abstract: loaderData.antrag.abstract } : {}),
          ...(loaderData.antrag.initiativeFraktion ? { creator: { '@type': 'Organization', name: loaderData.antrag.initiativeFraktion } } : {}),
        })
      : []),
    ],
  }
}

function listHead(locale: Locale, base: string, crumb: string, title: string, description: string) {
  const path = withLocale(base, locale)
  return {
    meta: seoMeta({ title, description, canonical: path }),
    links: canonicalLink(path),
    scripts: base === '/' ? [] : breadcrumbJsonLd([{ name: 'Machtblick', path: withLocale('/', locale) }, { name: crumb, path }]),
  }
}

export function votesListHead(locale: Locale) {
  return listHead(
    locale,
    '/',
    copy[locale].navVotes,
    locale === 'en' ? 'Bundestag votes' : 'Abstimmungen im Bundestag',
    locale === 'en'
      ? 'All votes in the German Bundestag: results, majorities, defectors, and how each parliamentary group voted.'
      : 'Alle Abstimmungen des Deutschen Bundestags: Ergebnisse, Mehrheiten, Abweichler und das Stimmverhalten der Fraktionen im Überblick.',
  )
}

export function motionsListHead(locale: Locale) {
  return listHead(
    locale,
    '/motions',
    copy[locale].navMotions,
    locale === 'en' ? 'Motions' : 'Anträge',
    locale === 'en'
      ? 'All motions and bills in the German Bundestag: who proposes them, where they stand in the process, and how parliament decided.'
      : 'Alle Anträge und Gesetzentwürfe des Deutschen Bundestags: wer sie einbringt, wo sie im Verfahren stehen und wie das Parlament entschieden hat.',
  )
}

export function membersListHead(locale: Locale) {
  return listHead(
    locale,
    '/members',
    copy[locale].navMembers,
    locale === 'en' ? 'Members of the Bundestag' : 'Alle Bundestagsabgeordneten',
    locale === 'en'
      ? 'All members of the German Bundestag in the 21st term with photo, parliamentary group, federal state, attendance, and party-line loyalty in roll-call votes.'
      : 'Alle Abgeordneten des Deutschen Bundestags der 21. Wahlperiode mit Foto, Fraktion, Bundesland sowie Anwesenheit und Linientreue bei namentlichen Abstimmungen.',
  )
}

export function partiesListHead(locale: Locale) {
  return listHead(
    locale,
    '/parties',
    copy[locale].navParties,
    locale === 'en' ? 'Parties' : 'Fraktionen',
    locale === 'en'
      ? 'Parliamentary groups and independent members in the German Bundestag: seat distribution, members, cohesion, and voting behavior in roll-call votes.'
      : 'Fraktionen und fraktionslose Abgeordnete des Deutschen Bundestags: Sitzverteilung, Mitglieder und Abstimmungsverhalten.',
  )
}

export function speechesListHead(locale: Locale) {
  return listHead(
    locale,
    '/speeches',
    copy[locale].navSpeeches,
    locale === 'en' ? 'Speeches' : 'Reden',
    locale === 'en'
      ? 'Search the full text of every speech in the German Bundestag and filter by keyword, parliamentary group, date, and member.'
      : 'Alle Reden des Deutschen Bundestags im Volltext durchsuchen und nach Stichwort, Fraktion, Datum und Abgeordneten filtern.',
  )
}
