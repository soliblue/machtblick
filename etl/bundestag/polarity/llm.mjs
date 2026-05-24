import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const PROMPT_TEMPLATE = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/polarity.md', import.meta.url)), 'utf8').trimEnd()

function buildPrompt(title, document, proposer) {
  return PROMPT_TEMPLATE
    .replace('__TITLE__', title)
    .replace('__DOCUMENT__', document ?? '(nicht vorhanden)')
    .replace('__PROPOSER__', proposer ?? '(unbekannt)')
}

function runClaude(prompt, model) {
  return new Promise((resolve, reject) => {
    const c = spawn('claude', ['-p', '--model', model, '--output-format', 'json'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    c.stdout.on('data', (d) => (stdout += d))
    c.stderr.on('data', (d) => (stderr += d))
    c.on('close', (code) => {
      if (code !== 0) return reject(new Error(`claude exit ${code}: ${stderr}`))
      resolve(stdout)
    })
    c.stdin.write(prompt)
    c.stdin.end()
  })
}

function extractJson(raw) {
  const env = JSON.parse(raw)
  const result = env.result ?? env
  const text = typeof result === 'string' ? result : JSON.stringify(result)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`no JSON object in claude output: ${text.slice(0, 200)}`)
  return JSON.parse(match[0])
}

export async function classifyWithLLM({ title, document, proposer }) {
  const prompt = buildPrompt(title, document, proposer)
  const raw = await runClaude(prompt, 'sonnet')
  const obj = extractJson(raw)
  return {
    inverted: obj.inverted === true,
    rewrittenTitle: typeof obj.rewrittenTitle === 'string' ? obj.rewrittenTitle.trim() : null,
    confidence: obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low' ? obj.confidence : 'low',
    reason: typeof obj.reason === 'string' ? obj.reason : '',
  }
}
