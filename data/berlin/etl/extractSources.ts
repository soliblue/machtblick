import { readFile, writeFile } from 'node:fs/promises'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { load } from 'cheerio'

type SourceSnapshot = {
  url: string
  file: string
  contentType: string
  retrievedAt: string
}

const cacheDirectory = new URL('./.cache/', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('manifest.json', cacheDirectory), 'utf8')) as SourceSnapshot[]

const extractPdf = async (data: Buffer) => {
  const document = await getDocument({ data: new Uint8Array(data), isEvalSupported: false, useSystemFonts: true }).promise
  const pages: string[] = []
  for (let index = 1; index <= document.numPages; index += 1) {
    const content = await (await document.getPage(index)).getTextContent()
    pages.push(content.items.map((item) => 'str' in item ? item.str : '').join(' '))
  }
  return pages.join('\n')
}

for (const source of manifest) {
  const data = await readFile(new URL(source.file, cacheDirectory))
  const text = source.contentType.includes('pdf')
    ? await extractPdf(data)
    : (() => {
        const html = load(data.toString('utf8'))
        html('script, style, noscript, svg, nav, footer').remove()
        html('br').replaceWith('\n')
        return html('body').text().split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n')
      })()
  await writeFile(new URL(source.file.replace(/\.(html|pdf)$/, '.txt'), cacheDirectory), `${text}\n`)
}
