import { decodeHtmlEntities } from '../../_shared/entities.mjs'

export type VoteListDownload = {
  label: string
  publicationDate: string
  pdfUrl: string | null
  xlsxUrl: string
  sourceId: number | null
}

export type VoteListPage = {
  downloads: VoteListDownload[]
  hits: number | null
  resultCount: number
}

export function parseVoteListPage(html: string): VoteListPage {
  const bodies = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((match) => match[1])
  return {
    downloads: bodies.flatMap((body) => {
      const xlsxUrl = body.match(/href="([^"]+[-_]xls\.xlsx)"/)?.[1]
      return xlsxUrl ? [{
        label: htmlText(
          body.match(/<strong>\s*([\s\S]*?)\s*<\/strong>/)?.[1]
          ?? body.match(/<a\b(?=[^>]*href="[^"]+\.pdf")[^>]*>([\s\S]*?)<\/a>/)?.[1]
          ?? '',
        ),
        publicationDate: htmlText(
          body.match(/data-th="Veröffentlichung"[\s\S]*?<p>\s*([\s\S]*?)\s*<\/p>/)?.[1]
          ?? body.match(/<td\b[^>]*>\s*([\s\S]*?)\s*<\/td>/)?.[1]
          ?? '',
        ),
        pdfUrl: body.match(/href="([^"]+\.pdf)"/)?.[1] ?? null,
        xlsxUrl,
        sourceId: Number(body.match(/abstimmung\?id=(\d+)/)?.[1] ?? 0) || null,
      }] : []
    }),
    hits: Number(html.match(/data-hits="(\d+)"/)?.[1] ?? 0) || null,
    resultCount: bodies.length,
  }
}

export function hasNextVoteListPage(page: VoteListPage, offset: number, limit: number) {
  return page.hits === null ? page.resultCount === limit : offset + limit < page.hits
}

function htmlText(html: string) {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
}
