import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

const EXTRACTED = new URL('./extracted/', import.meta.url).pathname

const SCHEMA = JSON.stringify({
  type: 'object',
  required: ['votes'],
  properties: {
    votes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['index', 'subject', 'summary', 'context'],
        properties: {
          index: { type: 'integer' },
          subject: { type: 'string' },
          summary: { type: 'string' },
          context: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
})

const SYSTEM = `Summarize German Bundestag votes from Plenarprotokoll excerpts for a transparency website. For each block produce:
- subject: 2-6 word topical headline in German (e.g. "Mietpreisbremse", "EU-Mehrjähriger Finanzrahmen", "Reform Abgeordnetengesetz"). No procedural prefixes ("Antrag der", "Beschlussempfehlung"), no Drucksache numbers.
- summary: 1-3 neutral German sentences describing what was decided. Who proposed it, what it does, how the parties voted, the outcome. Mention Drucksachen only when central.
- context: 0-2 short German paragraphs (each ~3-5 sentences) of debate framing pulled from the surrounding speeches in the block. Use it to explain the political dispute, key arguments for/against, or notable interjections. Leave empty array if the block is purely procedural.
The 'index' must match the input block index exactly.`

async function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const c = spawn('claude', ['-p', '--model', 'sonnet', '--output-format', 'json', '--json-schema', SCHEMA, '--append-system-prompt', SYSTEM, prompt], { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    c.stdout.on('data', (d) => (out += d))
    c.stderr.on('data', (d) => (err += d))
    c.on('close', (code) => {
      if (code !== 0) return reject(new Error(`exit ${code}: ${err}`))
      try {
        const r = JSON.parse(out)
        if (r.is_error) return reject(new Error(r.result || 'claude error'))
        resolve(r.structured_output)
      } catch (e) {
        reject(new Error(`parse fail: ${e.message} :: ${out.slice(0, 500)}`))
      }
    })
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
    const prompt = `Enrich ${batch.length} vote events. Return JSON {"votes":[...]} with one entry per input block, matching the input 'index' field.\n\n` +
      batch.map(({ v, i: voteIdx }) => {
        const block = job.data.blocks[v.index]?.block ?? ''
        return `--- Block index=${v.index} ---\nTitle: ${v.title}\nOutcome: ${v.outcome}\nDrucksache: ${(v.drucksache ?? []).join(', ')}\nProse:\n${block}`
      }).join('\n\n')
    try {
      const res = await callClaude(prompt)
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
