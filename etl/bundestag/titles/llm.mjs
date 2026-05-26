import { spawn } from 'node:child_process'
import { buildPrompt } from './prompt.mjs'

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

export async function cleanTitleWithLLM({ title, summary, drucksacheTitle, polarityTitle, isSammelubersicht = false }) {
  const prompt = buildPrompt({ title, summary, drucksacheTitle, polarityTitle, isSammelubersicht })
  const raw = await runClaude(prompt, 'sonnet')
  const obj = extractJson(raw)
  const cleanTitle = typeof obj.clean_title === 'string' ? obj.clean_title.trim() : null
  return {
    clean_title: cleanTitle && cleanTitle.length > 0 ? cleanTitle : null,
    confidence: obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low' ? obj.confidence : 'low',
  }
}
