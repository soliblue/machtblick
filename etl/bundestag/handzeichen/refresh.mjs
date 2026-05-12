import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd, args, { stdio: 'inherit', cwd: HERE })
    c.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exit ${code}`))))
  })
}

console.log('→ fetch new protocols')
await run('node', [join(HERE, 'fetch.mjs')])

console.log('→ segment')
await run('node', [join(HERE, 'segment.mjs')])

console.log('→ extract (claude -p)')
await run('node', [join(HERE, 'extract.mjs')])

console.log('→ write to db')
await run('npx', ['tsx', join(HERE, 'write.mjs')])

console.log('✓ refresh complete')
