import { PARTY_LABEL, PARTY_ORDER } from '@/lib/parties'
import type { VoteChoice } from '@/views/votesList/VoteDistributionDonut'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Row = { party: string; members: number; yes: number; no: number; abstain: number; absent: number }
type Ballot = { memberId: string; name: string; party: string; choice: string }
type Props = { summaries: Row[]; highlight?: VoteChoice | null; memberBallots?: Ballot[] }

const CHOICE_COLOR: Record<VoteChoice, string> = {
  yes: 'var(--color-success)',
  no: 'var(--color-danger)',
  abstain: 'var(--color-yellow)',
  absent: 'color-mix(in oklab, var(--color-fg) 25%, var(--color-background))',
}

const CHOICE_FROM_DB: Record<string, VoteChoice> = {
  ja: 'yes',
  nein: 'no',
  enthalten: 'abstain',
  nicht_abgegeben: 'absent',
}

const CHOICE_LABEL: Record<VoteChoice, string> = {
  yes: 'Ja',
  no: 'Nein',
  abstain: 'Enthaltung',
  absent: 'Nicht abgegeben',
}

const CHOICE_ORDER: VoteChoice[] = ['yes', 'no', 'abstain', 'absent']

type Cell = { choice: VoteChoice; member?: { id: string; name: string } }

function buildCells(s: Row, ballots: Ballot[] | undefined): Cell[] {
  if (ballots && ballots.length > 0) {
    const mine = ballots.filter((b) => b.party === s.party)
    const grouped: Cell[] = []
    for (const c of CHOICE_ORDER) {
      for (const b of mine) {
        if (CHOICE_FROM_DB[b.choice] === c) grouped.push({ choice: c, member: { id: b.memberId, name: b.name } })
      }
    }
    return grouped
  }
  return [
    ...Array<VoteChoice>(s.yes).fill('yes').map((c) => ({ choice: c })),
    ...Array<VoteChoice>(s.no).fill('no').map((c) => ({ choice: c })),
    ...Array<VoteChoice>(s.abstain).fill('abstain').map((c) => ({ choice: c })),
    ...Array<VoteChoice>(s.absent).fill('absent').map((c) => ({ choice: c })),
  ]
}

export function PartyWaffle({ summaries, highlight, memberBallots }: Props) {
  const byParty = new Map(summaries.map((s) => [s.party, s]))
  const ordered = PARTY_ORDER.map((p) => byParty.get(p)).filter((s): s is Row => Boolean(s))
  return (
    <TooltipProvider delayDuration={50}>
      <div className="grid gap-s" style={{ gridTemplateColumns: 'auto 1fr' }}>
        {ordered.map((s) => {
          const cells = buildCells(s, memberBallots)
          return (
            <div key={s.party} className="contents">
              <div className="self-center pr-m text-m font-semibold">{PARTY_LABEL[s.party] ?? s.party}</div>
              <div className="flex flex-wrap gap-[2px]">
                {cells.map((c, i) => {
                  const style = {
                    width: 12,
                    height: 12,
                    background: CHOICE_COLOR[c.choice],
                    opacity: !highlight || highlight === c.choice ? 1 : 0.15,
                    transition: 'opacity 120ms, transform 80ms',
                    display: 'block',
                    cursor: c.member ? 'pointer' : 'default',
                  } as const
                  if (!c.member) return <div key={i} style={style} />
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <a
                          href={`/members/${c.member.id}/`}
                          style={style}
                          aria-label={c.member.name}
                          className="hover:scale-150"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="font-semibold">{c.member.name}</div>
                        <div className="opacity-l">{CHOICE_LABEL[c.choice]}</div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
