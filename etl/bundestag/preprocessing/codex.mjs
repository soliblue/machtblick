import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PREPROCESSING_MODEL, PREPROCESSING_REASONING_EFFORT } from './config.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

export function runPreprocessingCodex({
  prompt,
  schemaPath = null,
  systemPrompt = null,
  timeoutMs = 240000,
  tmpPrefix = 'machtblick-preprocessing-',
}) {
  const dir = mkdtempSync(join(tmpdir(), tmpPrefix))
  const outPath = join(dir, 'out.txt')
  const args = [
    '-a', 'never',
    'exec',
    '--model', PREPROCESSING_MODEL,
    '-c', `model_reasoning_effort="${PREPROCESSING_REASONING_EFFORT}"`,
    '--sandbox', 'read-only',
    '--ignore-rules',
    '--output-last-message', outPath,
    '--cd', root,
    '--ephemeral',
  ]
  if (schemaPath) args.push('--output-schema', schemaPath)
  args.push('-')
  return new Promise((resolve, reject) => {
    let settled = false
    const c = spawn('codex', args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stderr = ''
    const timer = setTimeout(() => {
      settled = true
      c.kill('SIGTERM')
      rmSync(dir, { recursive: true, force: true })
      reject(new Error(`codex timed out after ${timeoutMs}ms`))
    }, timeoutMs)
    c.stderr.on('data', (d) => (stderr += d))
    c.on('close', (code) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      if (code !== 0) {
        rmSync(dir, { recursive: true, force: true })
        reject(new Error(`codex exit ${code}: ${stderr}`))
        return
      }
      const text = readFileSync(outPath, 'utf8')
      rmSync(dir, { recursive: true, force: true })
      resolve(schemaPath ? JSON.parse(text) : text.trim())
    })
    c.stdin.write(systemPrompt ? `${systemPrompt.trimEnd()}\n\n${prompt}` : prompt)
    c.stdin.end()
  })
}
