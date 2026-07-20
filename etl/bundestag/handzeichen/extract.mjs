import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'

const BLOCKS = new URL('./blocks/', import.meta.url).pathname
const OUT = new URL('./extracted/', import.meta.url).pathname
await mkdir(OUT, { recursive: true })

const schemaPath = fileURLToPath(new URL('./extract-schema.json', import.meta.url))
const SYSTEM = (await readFile(new URL('../../../prompts/etl/bundestag/handzeichen-extract-system.md', import.meta.url), 'utf8')).trimEnd()
const PROMPT_TEMPLATE = (await readFile(new URL('../../../prompts/etl/bundestag/handzeichen-extract.md', import.meta.url), 'utf8')).trimEnd()

async function callModel(prompt) {
  return runPreprocessingCodex({
    prompt,
    schemaPath,
    systemPrompt: SYSTEM,
    tmpPrefix: 'machtblick-handzeichen-extract-',
  })
}

async function readExisting(p) {
  return readFile(p, 'utf8').then((text) => JSON.parse(text), () => null)
}

const BATCH_SIZE = 5
const CONCURRENCY = 4
const files = (await readdir(BLOCKS)).filter((f) => f.endsWith('.json')).sort()

const jobs = []
for (const f of files) {
  const outPath = join(OUT, f)
  const data = JSON.parse(await readFile(join(BLOCKS, f), 'utf8'))
  const existing = await readExisting(outPath)
  if (data.blocks.length === 0) {
    if (!existing) await writeFile(outPath, JSON.stringify({ ...data, votes: [] }, null, 2))
    continue
  }
  if ((existing?.votes?.length ?? 0) > 0) continue
  jobs.push({ file: f, data, outPath })
}

console.log(`${jobs.length} protocols to extract`)

async function processJob(job) {
  const allVotes = []
  for (let i = 0; i < job.data.blocks.length; i += BATCH_SIZE) {
    const batch = job.data.blocks.slice(i, i + BATCH_SIZE)
    const prompt = PROMPT_TEMPLATE
      .replace('__COUNT__', String(batch.length))
      .replace('__BLOCKS__', batch.map((b, k) => `--- Block index=${i + k} ---\n${b.context ? `Kontext (gehört zu vorherigen Abstimmungen, nur zum Auflösen von Verweisen):\n${b.context}\n\nAbstimmung:\n` : ''}${b.block}`).join('\n\n'))
    const res = await callModel(prompt).catch((e) => {
      throw new Error(`${job.file} batch ${i / BATCH_SIZE + 1} failed: ${e.message}`)
    })
    allVotes.push(...res.votes)
    process.stdout.write(`  ${job.file} batch ${i / BATCH_SIZE + 1}/${Math.ceil(job.data.blocks.length / BATCH_SIZE)}\n`)
  }
  await writeFile(job.outPath, JSON.stringify({ ...job.data, votes: allVotes }, null, 2))
  console.log(`✓ ${job.file}: ${allVotes.length} votes`)
}

const queue = [...jobs]
const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const job = queue.shift()
    if (!job) break
    await processJob(job)
  }
})
await Promise.all(workers)
console.log('done')
