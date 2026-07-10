import { useState } from 'react'
import type { MpMemberListItem } from '@/server/mpMembers'
import type { ParliamentSlug } from '@/lib/parliaments'
import { MpSectionNav } from './MpSectionNav'
import { MpMemberCard } from './MpMemberCard'
import { MpEmpty } from './MpEmpty'

type Props = { section: ParliamentSlug; members: MpMemberListItem[] }

const chip = (active: boolean) =>
  `border border-fg/15 px-m py-xs text-s ${active ? 'bg-surface font-semibold' : 'opacity-l hover:opacity-100'}`

export function MpMembersList({ section, members }: Props) {
  const [group, setGroup] = useState<string | null>(null)
  const [germanOnly, setGermanOnly] = useState(false)
  const [national, setNational] = useState<string | null>(null)
  const hasCountry = members.some((m) => m.country)
  const groups = Array.from(new Map(members.filter((m) => m.party).map((m) => [m.party, m.label])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'de'))
  const nationalParties = Array.from(new Set(members.filter((m) => m.country === 'DEU' && m.nationalParty).map((m) => m.nationalParty as string))).sort((a, b) => a.localeCompare(b, 'de'))
  const filtered = members.filter(
    (m) => (!group || m.party === group) && (!germanOnly || m.country === 'DEU') && (!national || m.nationalParty === national),
  )
  return (
    <>
      <MpSectionNav section={section} active="members" />
      {members.length === 0 ? (
        <MpEmpty>Noch keine Abgeordneten geladen.</MpEmpty>
      ) : (
        <main className="mx-auto max-w-3xl px-l py-l">
          <div className="flex flex-col gap-m">
            {hasCountry && (
              <div>
                <p className="mb-s text-s caption opacity-l">Land</p>
                <div className="flex flex-wrap gap-s">
                  <button type="button" className={chip(!germanOnly)} onClick={() => { setGermanOnly(false); setNational(null) }}>Alle Länder</button>
                  <button type="button" className={chip(germanOnly)} onClick={() => setGermanOnly(true)}>Deutschland</button>
                </div>
              </div>
            )}
            {germanOnly && nationalParties.length > 0 && (
              <div>
                <p className="mb-s text-s caption opacity-l">Partei</p>
                <div className="flex flex-wrap gap-s">
                  <button type="button" className={chip(!national)} onClick={() => setNational(null)}>Alle</button>
                  {nationalParties.map((np) => (
                    <button key={np} type="button" className={chip(national === np)} onClick={() => setNational(national === np ? null : np)}>{np}</button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-s text-s caption opacity-l">Fraktion</p>
              <div className="flex flex-wrap gap-s">
                <button type="button" className={chip(!group)} onClick={() => setGroup(null)}>Alle</button>
                {groups.map(([slug, label]) => (
                  <button key={slug} type="button" className={chip(group === slug)} onClick={() => setGroup(group === slug ? null : slug)}>{label}</button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-l text-s caption opacity-l">{filtered.length} Abgeordnete</p>
          <div className="mt-m grid grid-cols-2 gap-m sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((m, i) => (
              <MpMemberCard key={m.id} member={m} section={section} index={i} />
            ))}
          </div>
        </main>
      )}
    </>
  )
}
