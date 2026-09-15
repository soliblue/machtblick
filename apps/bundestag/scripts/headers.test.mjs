import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function parseHeaders(source) {
  const blocks = {}
  let path
  for (const line of source.split(/\r?\n/)) {
    if (line.trim() && !line.trimStart().startsWith('#')) {
      if (/^\s/.test(line)) {
        assert.ok(path, 'Header must belong to a path block')
        const match = line.match(/^\s+([\w-]+):\s*(.+)$/)
        assert.ok(match, `Invalid header: ${line}`)
        const name = match[1].toLowerCase()
        assert.ok(!Object.hasOwn(blocks[path], name), `Duplicate header: ${name}`)
        blocks[path][name] = match[2].trim()
      } else {
        path = line.trim()
        assert.ok(path.startsWith('/'), `Invalid path: ${path}`)
        assert.ok(!Object.hasOwn(blocks, path), `Duplicate path: ${path}`)
        blocks[path] = {}
      }
    }
  }
  return blocks
}

function parsePolicy(value) {
  assert.equal(typeof value, 'string')
  const directives = {}
  for (const part of value.split(';').filter((part) => part.trim())) {
    const [name, ...sources] = part.trim().split(/\s+/)
    assert.ok(!Object.hasOwn(directives, name.toLowerCase()), `Duplicate directive: ${name}`)
    directives[name.toLowerCase()] = sources
  }
  return directives
}

const headers = parseHeaders(readFileSync(new URL('../public/_headers', import.meta.url), 'utf8'))

test('parses path blocks, case-insensitive headers, comments, and URL colons', () => {
  assert.deepEqual(parseHeaders('# headers\r\n/*\r\n  LINK: <https://soli.blue/>; rel="test"\r\n\r\n/assets/*\r\n  Cache-Control: public\r\n'), {
    '/*': { link: '<https://soli.blue/>; rel="test"' },
    '/assets/*': { 'cache-control': 'public' },
  })
  assert.throws(() => parseHeaders('  Link: orphan'))
  assert.throws(() => parseHeaders('/*\n  Invalid header'))
  assert.throws(() => parseHeaders('/*\n  Link: one\n  LINK: two'))
  assert.throws(() => parseHeaders('/*\n/*'))
  assert.throws(() => parsePolicy("frame-ancestors https://soli.blue; FRAME-ANCESTORS 'self'"))
})

test('has no X-Frame-Options in any path block', () => {
  for (const block of Object.values(headers)) {
    assert.ok(!Object.hasOwn(block, 'x-frame-options'))
  }
})

test('enforces only the exact soli.blue parent and aligns report-only framing', () => {
  assert.deepEqual(parsePolicy(headers['/*']['content-security-policy']), {
    'frame-ancestors': ['https://soli.blue'],
  })
  assert.deepEqual(parsePolicy(headers['/*']['content-security-policy-report-only'])['frame-ancestors'],
    parsePolicy(headers['/*']['content-security-policy'])['frame-ancestors'])
})

test('preserves all other report-only directives', () => {
  const directives = parsePolicy(headers['/*']['content-security-policy-report-only'])
  delete directives['frame-ancestors']
  assert.deepEqual(directives, {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https://commons.wikimedia.org', 'https://upload.wikimedia.org', 'https://www.abgeordnetenwatch.de'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  })
})

test('preserves all other headers and path blocks without framing overrides', () => {
  const remaining = structuredClone(headers)
  delete remaining['/*']['content-security-policy']
  delete remaining['/*']['content-security-policy-report-only']
  assert.deepEqual(remaining, {
    '/*.json': { 'cache-control': 'public, max-age=3600, s-maxage=86400' },
    '/_build/*': { 'cache-control': 'public, max-age=31536000, immutable' },
    '/assets/*': { 'cache-control': 'public, max-age=31536000, immutable' },
    '/*': {
      'cache-control': 'public, max-age=3600, s-maxage=86400',
      link: '</.well-known/api-catalog>; rel="api-catalog", </llms.txt>; rel="service-doc"',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    },
    '/.well-known/api-catalog': { 'content-type': 'application/linkset+json' },
    '/.well-known/mcp/server-card.json': { 'content-type': 'application/json' },
    '/.well-known/agent-skills/index.json': { 'content-type': 'application/json' },
  })
})
