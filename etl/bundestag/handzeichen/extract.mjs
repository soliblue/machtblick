import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises'
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

const SYSTEM = `Extract Bundestag vote events from protocol excerpts. Aliases:
- Koalitionsfraktionen / Koalition = CDU/CSU + SPD
- Union / Unionsfraktion = CDU/CSU
- Bündnis 90/Die Grünen / Grüne = B90/Grüne
- Linke / Linksfraktion = Die Linke
Title: clean short German title without procedural prefix. Drucksache: every "21/NNNN" reference. vote_type: 'hammelsprung' if Hammelsprung mentioned, 'namentlich' if namentliche Abstimmung, else 'handzeichen'. Omit unmentioned parties from arrays. If positions are unclear or mixed within a Fraktion (e.g. "mehrheitlich"), pick majority direction. The 'index' must match the input block index exactly.`

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

async function fileExists(p) {
  try { await stat(p); return true } catch { return false }
}

const BATCH_SIZE = 5
const CONCURRENCY = 4
const files = (await readdir(BLOCKS)).filter((f) => f.endsWith('.json')).sort()

const jobs = []
for (const f of files) {
  const outPath = join(OUT, f)
  if (await fileExists(outPath)) continue
  const data = JSON.parse(await readFile(join(BLOCKS, f), 'utf8'))
  if (data.blocks.length === 0) {
    await writeFile(outPath, JSON.stringify({ ...data, votes: [] }, null, 2))
    continue
  }
  jobs.push({ file: f, data, outPath })
}

console.log(`${jobs.length} protocols to extract`)

async function processJob(job) {
  const allVotes = []
  for (let i = 0; i < job.data.blocks.length; i += BATCH_SIZE) {
    const batch = job.data.blocks.slice(i, i + BATCH_SIZE)
    const prompt = `Extract ${batch.length} vote events. Return JSON {"votes":[...]} with one entry per input block, matching the input 'index' field.\n\n` +
      batch.map((b, k) => `--- Block index=${i + k} ---\n${b.block}`).join('\n\n')
    try {
      const res = await callClaude(prompt)
      allVotes.push(...res.votes)
      process.stdout.write(`  ${job.file} batch ${i / BATCH_SIZE + 1}/${Math.ceil(job.data.blocks.length / BATCH_SIZE)}\n`)
    } catch (e) {
      console.error(`  ${job.file} batch ${i / BATCH_SIZE + 1} failed: ${e.message}`)
    }
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
