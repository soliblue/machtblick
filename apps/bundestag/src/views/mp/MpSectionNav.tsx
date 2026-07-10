import { PARLIAMENTS, type ParliamentSlug } from '@/lib/parliaments'

type Tab = 'votes' | 'members' | 'parties'

type Props = { section: ParliamentSlug; active: Tab }

const TABS: Array<{ key: Tab; label: string; path: (s: string) => string }> = [
  { key: 'votes', label: 'Abstimmungen', path: (s) => `/${s}/` },
  { key: 'members', label: 'Abgeordnete', path: (s) => `/${s}/members/` },
  { key: 'parties', label: 'Fraktionen', path: (s) => `/${s}/parties/` },
]

const SWITCHER = [{ slug: 'bundestag', name: 'Bundestag', path: '/votes/' }, ...PARLIAMENTS.map((p) => ({ slug: p.slug, name: p.shortName, path: `/${p.slug}/` }))]

export function MpSectionNav({ section, active }: Props) {
  const current = PARLIAMENTS.find((p) => p.slug === section)!
  return (
    <div className="sticky top-[54px] z-20 border-b border-fg/15 bg-background">
      <div className="mx-auto max-w-3xl px-l pt-s">
        <nav aria-label="Parlament wechseln" className="flex flex-wrap items-center gap-x-m gap-y-xs text-s caption">
          {SWITCHER.map((p) => (
            <a
              key={p.slug}
              href={p.path}
              className={p.slug === section ? 'font-semibold opacity-100' : 'opacity-l hover:opacity-100'}
            >
              {p.name}
            </a>
          ))}
        </nav>
        <div className="mt-s flex items-baseline gap-l">
          <h1 className="font-display text-l font-semibold leading-none">{current.name}</h1>
        </div>
        <nav aria-label="Bereich" className="mt-s flex gap-l text-m">
          {TABS.map((tb) => (
            <a
              key={tb.key}
              href={tb.path(section)}
              className={`pb-s ${tb.key === active ? 'border-b-2 border-fg font-semibold' : 'opacity-l hover:opacity-100'}`}
            >
              {tb.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
