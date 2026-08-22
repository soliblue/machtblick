export type AwMapping = {
  memberId: string
  awPoliticianId: number
}

export function assertAwPublishReady(retained: AwMapping[], replacements: AwMapping[], invalid: AwMapping[], currentPoliticianIds: Set<number>) {
  const finalMappings = [...retained, ...replacements]
  const memberIds = new Set<string>()
  const politicianIds = new Set<number>()
  for (const mapping of finalMappings) {
    if (memberIds.has(mapping.memberId)) throw new Error(`duplicate AW member mapping ${mapping.memberId}`)
    if (politicianIds.has(mapping.awPoliticianId)) throw new Error(`duplicate AW politician mapping ${mapping.awPoliticianId}`)
    memberIds.add(mapping.memberId)
    politicianIds.add(mapping.awPoliticianId)
  }
  const missingReplacement = invalid.find((mapping) => currentPoliticianIds.has(mapping.awPoliticianId) && !politicianIds.has(mapping.awPoliticianId))
  if (missingReplacement) throw new Error(`replacement not ready for AW politician ${missingReplacement.awPoliticianId}`)
  const missingCurrent = [...currentPoliticianIds].find((politicianId) => !politicianIds.has(politicianId))
  if (missingCurrent) throw new Error(`current AW politician ${missingCurrent} not ready`)
}

export async function publishAfterAwReplacementsReady<TJob, TReplacement extends AwMapping, TResult>(
  jobs: TJob[],
  prepare: (job: TJob) => Promise<TReplacement | null>,
  retained: AwMapping[],
  invalid: AwMapping[],
  currentPoliticianIds: Set<number>,
  publish: (replacements: TReplacement[]) => TResult,
) {
  const replacements: TReplacement[] = []
  for (const job of jobs) {
    const replacement = await prepare(job)
    if (replacement) replacements.push(replacement)
  }
  assertAwPublishReady(retained, replacements, invalid, currentPoliticianIds)
  return publish(replacements)
}
