export type DetailBallot = {
  party: string
  state: string
  last: string
  first: string
  yes: number
  no: number
  abstain: number
  absent: number
}

export const DETAIL_BALLOT_LABEL = 'Namensliste'

export function needsXlsxRefresh(linkHasXlsx: boolean, storedHasXlsx: boolean, storedHasDetailBallots: boolean) {
  return linkHasXlsx && storedHasDetailBallots && !storedHasXlsx
}

export function parseDetailBallots(html: string): DetailBallot[] {
  return [...html.matchAll(/<div([^>]*\bclass="[^"]*\bbt-teaser-person-text\b[^"]*"[^>]*)>([\s\S]*?)<\/div>/g)].map(([, attrs, body]) => {
    const [, last = '', first = ''] = htmlText(body.match(/<h3>\s*([\s\S]*?)\s*<\/h3>/)?.[1] ?? '').match(/^([^,]+),\s*(.+)$/) ?? []
    const party = htmlText(body.match(/<p class="bt-person-fraktion">\s*([\s\S]*?)\s*<\/p>/)?.[1] ?? '')
    const ballot = body.match(/\bbt-abstimmung-(ja|nein|enthalten|na)\b/)?.[1] ?? ''
    return {
      party,
      state: htmlText(attrs.match(/data-bundesland="([^"]*)"/)?.[1] ?? ''),
      last,
      first,
      yes: ballot === 'ja' ? 1 : 0,
      no: ballot === 'nein' ? 1 : 0,
      abstain: ballot === 'enthalten' ? 1 : 0,
      absent: ballot === 'na' ? 1 : 0,
    }
  })
}

function htmlText(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim()
}
