import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'

const EXTRACTED = new URL('./extracted/', import.meta.url).pathname

const schemaPath = fileURLToPath(new URL('./enrich-schema.json', import.meta.url))
const SYSTEM = (await readFile(new URL('../../../prompts/etl/bundestag/handzeichen-enrich-system.md', import.meta.url), 'utf8')).trimEnd()
const PROMPT_TEMPLATE = (await readFile(new URL('../../../prompts/etl/bundestag/handzeichen-enrich.md', import.meta.url), 'utf8')).trimEnd()

async function callModel(prompt) {
  return runPreprocessingCodex({
    prompt,
    schemaPath,
    systemPrompt: SYSTEM,
    tmpPrefix: 'machtblick-handzeichen-enrich-',
  })
}

const BATCH_SIZE = 4
const CONCURRENCY = 4
const files = (await readdir(EXTRACTED)).filter((f) => f.endsWith('.json')).sort()

const jobs = []
for (const f of files) {
  const path = join(EXTRACTED, f)
  const data = JSON.parse(await readFile(path, 'utf8'))
  if (!data.votes?.length) continue
  const needs = data.votes
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v.vote_type !== 'namentlich' && (v.subject === undefined || v.summary === undefined))
  if (!needs.length) continue
  jobs.push({ file: f, path, data, needs })
}

const totalVotes = jobs.reduce((a, j) => a + j.needs.length, 0)
console.log(`${jobs.length} protocols, ${totalVotes} votes to enrich`)

async function processJob(job) {
  for (let i = 0; i < job.needs.length; i += BATCH_SIZE) {
    const batch = job.needs.slice(i, i + BATCH_SIZE)
    const prompt = PROMPT_TEMPLATE
      .replace('__COUNT__', String(batch.length))
      .replace('__BLOCKS__', batch.map(({ v }) => {
        const block = job.data.blocks[v.index]?.block ?? ''
        return `--- Block index=${v.index} ---\nTitle: ${v.title}\nOutcome: ${v.outcome}\nDrucksache: ${(v.drucksache ?? []).join(', ')}\nProse:\n${block}`
      }).join('\n\n'))
    try {
      const res = await callModel(prompt)
      const byIndex = new Map(res.votes.map((r) => [r.index, r]))
      for (const { v } of batch) {
        const enr = byIndex.get(v.index)
        if (!enr) continue
        v.subject = enr.subject
        v.summary = enr.summary
        v.context = enr.context
      }
      await writeFile(job.path, JSON.stringify(job.data, null, 2))
      process.stdout.write(`  ${job.file} batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(job.needs.length / BATCH_SIZE)}\n`)
    } catch (e) {
      console.error(`  ${job.file} batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${e.message}`)
    }
  }
  console.log(`✓ ${job.file}`)
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
