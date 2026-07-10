import type { MpPartyDetail as MpPartyDetailData } from '@/server/mpParties'
import type { ParliamentSlug } from '@/lib/parliaments'
import { pct } from '@/lib/format'
import { initials } from '@/lib/initials'
import { MpSectionNav } from './MpSectionNav'

type Props = { section: ParliamentSlug; data: MpPartyDetailData }

export function MpPartyDetail({ section, data }: Props) {
  return (
    <>
      <MpSectionNav section={section} active="parties" />
      <main className="mx-auto max-w-3xl px-l py-l">
        <h2 className="font-display text-xl font-semibold leading-[1.1]">{data.name}</h2>
        <div className="mt-l flex flex-wrap gap-x-xl gap-y-m">
          <Stat label="Sitze" value={String(data.seats)} />
          <Stat label="Geschlossenheit" value={pct(data.cohesion)} />
          <Stat label="Anwesenheit" value={pct(data.attendance)} />
          <Stat label="Abgeordnete" value={String(data.members.length)} />
        </div>

        <h3 className="mt-xl text-s caption opacity-l">Abgeordnete</h3>
        <div className="mt-m grid grid-cols-2 gap-m sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.members.map((m, i) => (
            <a key={m.id} href={`/${section}/members/${m.id}/`} className="flex flex-col border border-fg/15 bg-background transition-opacity hover:opacity-80">
              {m.pictureUrl ? (
                <img src={m.pictureUrl} alt={m.name} loading={i < 12 ? 'eager' : 'lazy'} decoding="async" className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-surface">
                  <span className="text-xl font-semibold opacity-m">{initials(m.name)}</span>
                </div>
              )}
              <div className="p-s desk:p-m">
                <p className="text-s font-semibold line-clamp-2 desk:text-m" style={{ overflowWrap: 'anywhere' }}>{m.name}</p>
                {m.nationalParty && <p className="mt-xs truncate text-s opacity-l">{m.nationalParty}</p>}
              </div>
            </a>
          ))}
        </div>
      </main>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-s caption opacity-l">{label}</p>
      <p className="mt-xs font-display text-[32px] font-semibold leading-[0.9] tracking-[-0.015em] tabular-nums">{value}</p>
    </div>
  )
}
