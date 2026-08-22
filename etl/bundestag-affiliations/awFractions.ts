import { AW_API, awJson } from '../_shared/awClient.ts'
import { normalizeFractionLabel } from '../_shared/parties.ts'

const PARLIAMENT_PERIOD = 161

function fractionParty(label: string): string {
  const party = normalizeFractionLabel(label)
  if (!party) throw new Error(`Unknown AW fraction label: ${JSON.stringify(label)}`)
  return party
}

export type AwMandate = {
  mandateId: number
  politicianId: number
  politicianLabel: string
  currentFraction: string
  currentValidFrom: string | null
  mandateValidFrom: string | null
}

export async function fetchAwMandates(): Promise<AwMandate[]> {
  const body = await awJson<{ data: Array<{
    id: number
    start_date: string | null
    politician: { id: number; label: string }
    fraction_membership: Array<{ fraction: { label: string }; valid_from: string; label: string }> | null
  }> }>(`${AW_API}/candidacies-mandates?parliament_period=${PARLIAMENT_PERIOD}&range_end=1000`)
  return body.data.map((m) => {
    const fm = m.fraction_membership ?? []
    const last = fm[fm.length - 1]
    return {
      mandateId: m.id,
      politicianId: m.politician.id,
      politicianLabel: m.politician.label,
      currentFraction: last ? fractionParty(last.fraction.label) : '',
      currentValidFrom: last && /\bseit\b/.test(last.label) ? last.valid_from : null,
      mandateValidFrom: m.start_date,
    }
  })
}

export async function fetchAwMandateEnd(mandateId: number): Promise<string | null> {
  const body = await awJson<{ data: { end_date: string | null } }>(`${AW_API}/candidacies-mandates/${mandateId}`)
  return body.data.end_date
}

export async function fetchParliamentPeriodStart(): Promise<string> {
  const body = await awJson<{ data: { start_date_period: string } }>(`${AW_API}/parliament-periods/${PARLIAMENT_PERIOD}`)
  return body.data.start_date_period
}
