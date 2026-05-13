import { spawn } from 'node:child_process'
import { buildPrompt } from './prompt.mjs'

function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    const c = spawn('claude', ['-p', '--model', 'sonnet', '--output-format', 'json'], { stdio: ['pipe', 'pipe', 'pipe'] })
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

export async function generateDescriptions(title, antragText, kind = 'antrag') {
  const prompt = buildPrompt(title, antragText, kind)
  const raw = await runClaude(prompt)
  const obj = extractJson(raw)
  const simplified = typeof obj.summary_simplified === 'string' ? obj.summary_simplified.trim() : null
  const detail = typeof obj.summary_detail === 'string' ? obj.summary_detail.trim() : null
  if (!simplified || !detail) throw new Error(`incomplete LLM output: ${JSON.stringify(obj).slice(0, 200)}`)
  return { summarySimplified: simplified, summaryDetail: detail }
}
