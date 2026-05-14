import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PartyHistory, PartyHistoryPoint } from '@/server/getPartyHistory'
import { PartyHistoryTooltip } from './PartyHistoryTooltip'
import { PartyHistoryEventStrip, type StripEvent } from './PartyHistoryEventStrip'
import { PartyHistoryEmpty } from './PartyHistoryEmpty'

type Props = {
  history: PartyHistory
  partyLabel: string
  partyColor: string
}

type ChartPoint = {
  termNumber: number
  termLabel: string
  seats: number
  totalSeats: number
  pctOfTotal: number
  pctValue: number
  partyNameAtTime: string
}

const MARGIN = { top: 56, right: 8, bottom: 8, left: 8 }
const X_PADDING = 24
const GRADIENT_ID_PREFIX = 'party-history-gradient-'
const EVENT_PALETTE = ['var(--color-rust)', 'var(--color-teal)', 'var(--color-indigo)', 'var(--color-brown)']

function dedupePoints(points: PartyHistoryPoint[]): PartyHistoryPoint[] {
  const byTerm = new Map<number, PartyHistoryPoint>()
  for (const p of points) {
    const existing = byTerm.get(p.termNumber)
    if (!existing || p.seats > existing.seats) byTerm.set(p.termNumber, p)
  }
  return [...byTerm.values()].sort((a, b) => a.termNumber - b.termNumber)
}

function toChartPoints(points: PartyHistoryPoint[]): ChartPoint[] {
  return points.map((p, i) => {
    const next = points[i + 1]
    const termLabel = next ? `${p.year} - ${next.year - 1}` : `${p.year} - heute`
    return {
      termNumber: p.termNumber,
      termLabel,
      seats: p.seats,
      totalSeats: p.totalSeats,
      pctOfTotal: p.pctOfTotal,
      pctValue: p.pctOfTotal * 100,
      partyNameAtTime: p.partyNameAtTime,
    }
  })
}

function anchorEvents(events: PartyHistory['events'], points: PartyHistoryPoint[]): StripEvent[] {
  const firstTerm = points[0].termNumber
  const lastTerm = points[points.length - 1].termNumber
  return events.map((e, i) => {
    const eventYear = Number(e.date.slice(0, 4))
    const leading = eventYear < points[0].year
    let anchor = firstTerm
    if (!leading) {
      for (let j = points.length - 1; j >= 0; j--) {
        if (eventYear >= points[j].year) {
          anchor = points[j].termNumber
          break
        }
      }
    }
    return {
      ...e,
      anchorTerm: Math.min(Math.max(anchor, firstTerm), lastTerm),
      leading,
      color: EVENT_PALETTE[i % EVENT_PALETTE.length],
    }
  })
}

export function PartyHistoryChart({ history, partyLabel, partyColor }: Props) {
  const points = useMemo(() => dedupePoints(history.points), [history.points])
  const data = useMemo(() => toChartPoints(points), [points])
  if (data.length === 0) return null
  if (data.length === 1) {
    return (
      <PartyHistoryEmpty
        point={points[0]}
        partyLabel={partyLabel}
        partyColor={partyColor}
        events={history.events}
      />
    )
  }
  const firstTerm = data[0].termNumber
  const lastTerm = data[data.length - 1].termNumber
  const events = anchorEvents(history.events, points)
  const maxPct = Math.max(...data.map((d) => d.pctValue))
  const yMax = Math.ceil(maxPct) + 1
  const gradientId = `${GRADIENT_ID_PREFIX}${partyLabel.replace(/\W/g, '')}`
  const axisColor = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'
  const tickStyle = { fontSize: 12, fill: 'var(--color-fg)', opacity: 0.7 }
  return (
    <div className="relative w-full" style={{ height: 320 }}>
      <PartyHistoryEventStrip
        events={events}
        xMin={firstTerm}
        xMax={lastTerm}
        leftPad={MARGIN.left + X_PADDING}
        rightPad={MARGIN.right + X_PADDING}
      />
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={MARGIN}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={partyColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={partyColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={axisColor} strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="termNumber"
            type="number"
            domain={[firstTerm, lastTerm]}
            ticks={data.map((d) => d.termNumber)}
            tickFormatter={(v) => `${v}.`}
            tickLine={false}
            axisLine={{ stroke: axisColor }}
            tick={tickStyle}
            allowDecimals={false}
            padding={{ left: X_PADDING, right: X_PADDING }}
          />
          <YAxis domain={[0, yMax]} hide />
          <Tooltip content={<PartyHistoryTooltip />} cursor={{ stroke: axisColor, strokeDasharray: '3 3' }} />
          {events.map((e, i) => (
            <ReferenceLine
              key={`ref-${e.date}-${i}`}
              x={e.anchorTerm}
              stroke={e.color}
              strokeOpacity={0.7}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ))}
          <Area
            type="monotone"
            dataKey="pctValue"
            stroke={partyColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: partyColor, stroke: 'var(--color-background)', strokeWidth: 1 }}
            activeDot={{ r: 5, fill: partyColor, stroke: 'var(--color-background)', strokeWidth: 2 }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="pctValue"
              position="top"
              offset={10}
              formatter={(v) => `${Number(v).toFixed(1).replace('.', ',')}%`}
              style={{ fontSize: 12, fill: 'var(--color-fg)', opacity: 0.7 }}
            />
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
