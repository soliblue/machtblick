import type { PartyRun } from './runsFromVotes.ts'

export type CurrentAwMandate = {
  memberId: string
  party: string
  factionValidFrom: string | null
  mandateValidFrom: string | null
}

type EffectiveRun = PartyRun & { validFrom: string }

export function buildAffiliationRows(
  runs: PartyRun[],
  currentMandates: CurrentAwMandate[],
  endByMember: Map<string, string>,
  periodStart: string,
  termId: number,
) {
  const currentByMember = new Map(currentMandates.map((mandate) => [mandate.memberId, mandate]))
  const byMember = new Map<string, PartyRun[]>()
  for (const run of runs) byMember.set(run.memberId, [...(byMember.get(run.memberId) ?? []), run])
  const rows: Array<{ memberId: string; party: string; validFrom: string; validTo: string | null; termId: number }> = []

  for (const [memberId, memberRuns] of byMember) {
    const current = currentByMember.get(memberId)
    const priorMandateEnd = endByMember.get(memberId)
    const effectiveRuns: EffectiveRun[] = memberRuns.map((run, index) => ({ ...run, validFrom: index === 0 ? periodStart : run.firstDate }))
    const mandateStart = current?.mandateValidFrom
    const reentered = Boolean(current && mandateStart && priorMandateEnd && priorMandateEnd < mandateStart)
    let currentMandateIndex = 0

    if (current && mandateStart && priorMandateEnd && reentered) {
      const firstCurrentRun = effectiveRuns.findIndex((run) => run.lastDate >= mandateStart)
      if (firstCurrentRun === -1) {
        effectiveRuns.push({ memberId, party: current.party, firstDate: mandateStart, lastDate: mandateStart, validFrom: laterDate(mandateStart, current.factionValidFrom) })
        currentMandateIndex = effectiveRuns.length - 1
      } else if (effectiveRuns[firstCurrentRun].firstDate < mandateStart) {
        const spanning = effectiveRuns[firstCurrentRun]
        effectiveRuns[firstCurrentRun] = { ...spanning, lastDate: priorMandateEnd }
        effectiveRuns.splice(firstCurrentRun + 1, 0, { ...spanning, firstDate: mandateStart, validFrom: mandateStart })
        currentMandateIndex = firstCurrentRun + 1
      } else {
        effectiveRuns[firstCurrentRun].validFrom = mandateStart
        currentMandateIndex = firstCurrentRun
      }
    }

    const lastRun = effectiveRuns.at(-1)!
    if (current?.factionValidFrom && current.factionValidFrom >= (mandateStart ?? periodStart)) {
      if (current.party !== lastRun.party && current.factionValidFrom > lastRun.lastDate) {
        effectiveRuns.push({ memberId, party: current.party, firstDate: current.factionValidFrom, lastDate: current.factionValidFrom, validFrom: current.factionValidFrom })
      } else if (current.party === lastRun.party) {
        const previous = effectiveRuns.at(-2)
        const lastIndex = effectiveRuns.length - 1
        if (current.factionValidFrom <= lastRun.firstDate && (
          previous && lastIndex - 1 >= currentMandateIndex && current.factionValidFrom > previous.lastDate
          || lastIndex === currentMandateIndex && current.factionValidFrom >= lastRun.validFrom
        )) {
          lastRun.validFrom = current.factionValidFrom
        }
      }
    }

    for (const [index, run] of effectiveRuns.entries()) {
      const next = effectiveRuns[index + 1]
      const validTo = next
        ? reentered && index + 1 === currentMandateIndex
          ? priorMandateEnd!
          : previousDay(next.validFrom)
        : current ? null : priorMandateEnd ?? null
      if (validTo && validTo < run.validFrom) throw new Error(`invalid affiliation range for ${memberId}: ${run.validFrom} to ${validTo}`)
      rows.push({ memberId, party: run.party, validFrom: run.validFrom, validTo, termId })
    }
  }

  for (const mandate of currentMandates) {
    if (!byMember.has(mandate.memberId) && mandate.party) {
      rows.push({
        memberId: mandate.memberId,
        party: mandate.party,
        validFrom: laterDate(mandate.mandateValidFrom ?? periodStart, mandate.factionValidFrom),
        validTo: null,
        termId,
      })
    }
  }

  return rows
}

export function missingOpenMandates<T extends { mandateId: number; validTo: string | null }>(mandates: T[], currentMandateIds: Set<number>) {
  return mandates.filter((mandate) => !mandate.validTo && !currentMandateIds.has(mandate.mandateId))
}

export function latestEndByMember(
  mandates: Array<{ memberId: string; mandateId: number | null; validTo: string | null }>,
  fetchedEnds: Map<number, string>,
) {
  const ends = new Map<string, string>()
  for (const mandate of mandates) {
    const end = mandate.validTo ?? (mandate.mandateId === null ? undefined : fetchedEnds.get(mandate.mandateId))
    if (end && end > (ends.get(mandate.memberId) ?? '')) ends.set(mandate.memberId, end)
  }
  return ends
}

function laterDate(first: string, second: string | null) {
  return second && second > first ? second : first
}

function previousDay(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}
