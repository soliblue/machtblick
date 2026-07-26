const germanDate = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
})

export function formatDate(date: string) {
  return germanDate.format(new Date(`${date}T00:00:00Z`))
}
