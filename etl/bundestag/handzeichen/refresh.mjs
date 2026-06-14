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

console.log('→ resolve proposers via DIP')
await run('node', [join(HERE, 'proposers.mjs')])

console.log('→ polarity normalization')
await run('node', [join(HERE, '..', 'polarity', 'run.mjs')])

console.log('→ procedural flagger (title-pattern → procedural=1)')
await run('node', [join(HERE, '..', 'votes', 'procedural', 'run.mjs')])

console.log('→ initiator backfill from plenarprotokoll XML')
await run('node', [join(HERE, '..', 'votes', 'initiator', 'run.mjs')])

console.log('→ self-no escalation (initiator voted NO → re-check polarity via LLM)')
await run('node', [join(HERE, '..', 'polarity', 'self-no-escalate.mjs')])

console.log('→ title provenance repair')
await run('npx', ['tsx', join(HERE, '..', '..', '..', 'db', 'normalize-vote-title-provenance.ts')])

console.log('→ self-no audit (must be clean)')
await run('node', [join(HERE, '..', 'votes', 'initiator', 'audit-self-no.mjs')])

console.log('→ suspicious-initiator audit (Fraktion initiator with procedural-shape title)')
await run('node', [join(HERE, '..', 'votes', 'initiator', 'audit-suspicious-initiator.mjs')])

console.log('→ descriptions (Antrag → simplified)')
await run('node', [join(HERE, '..', 'descriptions', 'run.mjs')])

console.log('→ clean titles')
await run('node', [join(HERE, '..', 'titles', 'run.mjs')])

console.log('→ clean title fallbacks')
await run('npx', ['tsx', join(HERE, '..', '..', '..', 'db', 'normalize-vote-title-provenance.ts'), '--fill-clean-title-fallbacks'])

console.log('→ backfill agenda_item from plenarprotokoll XML')
await run('npx', ['tsx', join(HERE, '..', 'votes', 'backfillAgendaItem.ts')])

console.log('→ materialize derived data (speech↔vote linkage)')
await run('npx', ['tsx', join(HERE, '..', '..', '..', 'db', 'materialize-derived-data.ts')])

console.log('→ party positions (handzeichen)')
await run('node', [join(HERE, '..', 'party-positions', 'run.mjs'), '--vote-type', 'handzeichen'])

console.log('→ party positions (namentlich)')
await run('node', [join(HERE, '..', 'party-positions', 'run.mjs'), '--vote-type', 'namentlich'])

console.log('→ public vote validation (after linkage + summaries; fails if a linked vote lacks a summary)')
await run('npx', ['tsx', join(HERE, '..', '..', '..', 'db', 'validate-public-votes.ts')])

console.log('→ translations (cascade EN from de summaries + party positions)')
await run('node', [join(HERE, '..', 'translations', 'run.mjs')])

console.log('✓ refresh complete')
