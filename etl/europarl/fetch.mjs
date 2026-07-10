import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createGunzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

const rawDir = fileURLToPath(new URL('./raw', import.meta.url))
const FILES = ['votes', 'member_votes', 'members', 'groups', 'group_memberships']
const base = 'https://github.com/HowTheyVote/data/releases/latest/download'

await mkdir(rawDir, { recursive: true })
for (const name of FILES) {
  const url = `${base}/${name}.csv.gz`
  process.stdout.write(`fetching ${name}.csv.gz ... `)
  const res = await fetch(url)
  await pipeline(Readable.fromWeb(res.body), createGunzip(), createWriteStream(`${rawDir}/${name}.csv`))
  console.log('done')
}
console.log('HowTheyVote CSVs downloaded to etl/europarl/raw/')
