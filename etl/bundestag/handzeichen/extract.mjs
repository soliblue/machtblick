import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

const BLOCKS = new URL('./blocks/', import.meta.url).pathname
const OUT = new URL('./extracted/', import.meta.url).pathname
await mkdir(OUT, { recursive: true })

const SCHEMA = JSON.stringify({
  type: 'object',
  required: ['votes'],
  properties: {
    votes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['index', 'title', 'outcome', 'vote_type', 'ja', 'nein', 'enth'],
        properties: {
          index: { type: 'integer' },
          title: { type: 'string' },
          drucksache: { type: 'array', items: { type: 'string' } },
          outcome: { type: 'string', enum: ['angenommen', 'abgelehnt', 'unklar'] },
          vote_type: { type: 'string', enum: ['handzeichen', 'hammelsprung', 'namentlich'] },
          ja: { type: 'array', items: { type: 'string', enum: ['CDU/CSU', 'SPD', 'AfD', 'B90/Grüne', 'Die Linke', 'BSW', 'FDP', 'fraktionslos'] } },
          nein: { type: 'array', items: { type: 'string', enum: ['CDU/CSU', 'SPD', 'AfD', 'B90/Grüne', 'Die Linke', 'BSW', 'FDP', 'fraktionslos'] } },
          enth: { type: 'array', items: { type: 'string', enum: ['CDU/CSU', 'SPD', 'AfD', 'B90/Grüne', 'Die Linke', 'BSW', 'FDP', 'fraktionslos'] } },
        },
      },
    },
  },
})

const SYSTEM = (await readFile(new URL('../../../prompts/etl/bundestag/handzeichen-extract-system.md', import.meta.url), 'utf8')).trimEnd()
const PROMPT_TEMPLATE = (await readFile(new URL('../../../prompts/etl/bundestag/handzeichen-extract.md', import.meta.url), 'utf8')).trimEnd()

async function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const c = spawn('claude', ['-p', '--model', 'sonnet', '--output-format', 'json', '--json-schema', SCHEMA, '--append-system-prompt', SYSTEM, prompt], { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    c.stdout.on('data', (d) => (out += d))
    c.stderr.on('data', (d) => (err += d))
    c.on('close', (code) => {
      if (code !== 0) return reject(new Error(`exit ${code}: ${err || out.slice(0, 500)}`))
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
      .replace('__BLOCKS__', batch.map((b, k) => `--- Block index=${i + k} ---\n${b.block}`).join('\n\n'))
    const res = await callClaude(prompt).catch((e) => {
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
