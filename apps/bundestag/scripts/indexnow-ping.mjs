import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const KEY = '5ad8cfc66abd353bfb34c0213d0f1dba'
const HOST = 'machtblick.de'
const args = process.argv.slice(2)
const all = args.includes('--all')
const daysArg = Number(args[args.indexOf('--days') + 1])
const days = args.includes('--days') && Number.isFinite(daysArg) && daysArg > 0 ? daysArg : 7
const sitemap = readFileSync(fileURLToPath(new URL('../public/sitemap.xml', import.meta.url)), 'utf8')
const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
const urls = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)]
  .filter(([, , lastmod]) => all || (lastmod && lastmod >= cutoff))
  .map(([, loc]) => loc)

if (urls.length === 0) {
  console.log(`indexnow: no URLs with lastmod within ${days} days, nothing to ping (use --all to ping everything)`)
  process.exit(0)
}

const chunks = Array.from({ length: Math.ceil(urls.length / 10000) }, (_, i) => urls.slice(i * 10000, (i + 1) * 10000))
for (const chunk of chunks) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: chunk }),
  })
  console.log(`indexnow: pinged ${chunk.length} URLs, status ${res.status}`)
}
