const PARLIAMENT_PERIOD = 161

const FRACTION_LABEL_TO_PARTY: Record<string, string> = {
  'CDU/CSU': 'CDU/CSU',
  'SPD': 'SPD',
  'AfD': 'AfD',
  'BÜNDNIS 90/­DIE GRÜNEN': 'B90/Grüne',
  'BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'Die Linke': 'Die Linke',
  'fraktionslos': 'fraktionslos',
}

function stripPeriodSuffix(label: string) {
  return label.replace(/\s*\(Bundestag.*\)\s*$/, '').trim()
}

export function fractionLabelToParty(label: string): string {
  const stripped = stripPeriodSuffix(label)
  const hit = FRACTION_LABEL_TO_PARTY[stripped]
  if (!hit) throw new Error(`Unknown AW fraction label: ${JSON.stringify(label)}`)
  return hit
}

export type AwMandate = {
  politicianId: number
  politicianLabel: string
  currentFraction: string
  currentValidFrom: string | null
}

export async function fetchAwMandates(): Promise<AwMandate[]> {
  const url = `https://www.abgeordnetenwatch.de/api/v2/candidacies-mandates?parliament_period=${PARLIAMENT_PERIOD}&range_end=1000`
  const res = await fetch(url)
  const body = await res.json() as { data: Array<{
    politician: { id: number; label: string }
    fraction_membership: Array<{ fraction: { label: string }; valid_from: string; valid_until: string | null; label: string }> | null
  }> }
  return body.data.map((m) => {
    const fm = m.fraction_membership ?? []
    const last = fm[fm.length - 1]
    return {
      politicianId: m.politician.id,
      politicianLabel: m.politician.label,
      currentFraction: last ? fractionLabelToParty(last.fraction.label) : '',
      currentValidFrom: last && /\bseit\b/.test(last.label) ? last.valid_from : null,
    }
  })
}

export async function fetchParliamentPeriodStart(): Promise<string> {
  const res = await fetch(`https://www.abgeordnetenwatch.de/api/v2/parliament-periods/${PARLIAMENT_PERIOD}`)
  const body = await res.json() as { data: { start_date_period: string } }
  return body.data.start_date_period
}
