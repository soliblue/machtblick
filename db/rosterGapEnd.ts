export function rosterGapEnd(
  hasTwoRosters: boolean,
  lastSeen: string | undefined,
  inRoster: boolean,
  openMandateFrom: string | undefined,
) {
  return hasTwoRosters && lastSeen && !inRoster && !(openMandateFrom && openMandateFrom > lastSeen) ? lastSeen : undefined
}
