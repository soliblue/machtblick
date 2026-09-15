import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const requireFragments = (source, file, fragments) => {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) throw new Error(`${fragment} missing from ${file}`)
  }
}

const rootRoute = read('apps/bundestag/src/routes/__root.tsx')
const languagePicker = read('apps/bundestag/src/views/nav/LanguagePicker.tsx')
const nav = read('apps/bundestag/src/views/nav/Nav.tsx')
const stamp = read('apps/bundestag/src/views/votesList/Stamp.tsx')
const hemicycle = read('apps/bundestag/src/views/votesList/VoteHemicycle.tsx')
const css = read('apps/bundestag/src/styles/globals.css')
const copy = read('apps/bundestag/src/lib/copy/de.ts') + read('apps/bundestag/src/lib/copy/en.ts')
const parties = read('apps/bundestag/src/lib/parties.ts')
const memberSpeechGroupRow = read('apps/bundestag/src/views/memberDetail/MemberSpeechGroupRow.tsx')
const bubbles = [
  read('apps/bundestag/src/views/speeches/ConversationBubble.tsx'),
  read('apps/bundestag/src/views/voteDetail/PartySummaryPreviewList.tsx'),
  memberSpeechGroupRow,
]
const reader = read('apps/bundestag/src/views/speeches/Reader.tsx')
const debateDialog = read('apps/bundestag/src/views/memberDetail/MemberDebateDialog.tsx')
const filterSheet = read('apps/bundestag/src/views/votesList/FilterSheet.tsx')
const memberCard = read('apps/bundestag/src/views/membersList/MemberCard.tsx')

requireFragments(rootRoute, '__root.tsx', [
  "{ name: 'theme-color', content: '#ffffff' }",
  "{ name: 'color-scheme', content: 'light' }",
  '<Nav />',
])
requireFragments(languagePicker, 'LanguagePicker.tsx', [
  'role="group"',
  'aria-label={label}',
  "shortLabel: 'DE'",
  "shortLabel: 'EN'",
  "aria-current={locale === value ? 'page' : undefined}",
  "expanded ? 'h-[44px] flex-1 text-m' : 'h-[32px]'",
  'bg-fg font-semibold text-background',
  'hover:bg-surface',
  'focus-visible:outline-background',
  'focus-visible:outline-fg',
  'expanded ? optionLabel : shortLabel',
])
requireFragments(css, 'globals.css', [
  'color-scheme: only light',
  '--color-background: #FFFFFF',
  '--color-fg: #0A0A0A',
  '--vote-neutral-abstain: color-mix(in oklab, var(--color-fg) 40%, transparent)',
  '--vote-neutral-absent: color-mix(in oklab, var(--color-fg) 15%, transparent)',
  '.stamp-mark {',
  'mix-blend-mode: multiply',
])
requireFragments(stamp, 'Stamp.tsx', [
  'stamp-mark',
  'border: `2.5px solid ${color}`',
  "borderRadius: 'var(--radius-s)'",
  'color,',
])
if (css.includes('.stamp-mark::after')) throw new Error('globals.css must keep stamps to one border')
if (stamp.includes('--stamp-color')) throw new Error('Stamp.tsx must not restore the second stamp border')
requireFragments(hemicycle, 'VoteHemicycle.tsx', [
  "abstain: 'var(--vote-neutral-abstain)'",
  "absent: 'var(--vote-neutral-absent)'",
  "+ (absent ?? 0) + noData ? 'absent' : 'no'",
])
requireFragments(css, 'party speech surfaces', [
  '.party-surface {',
  'background: color-mix(in oklab, var(--party-color) 10%, var(--color-background))',
])
for (const bubble of bubbles.slice(0, 2)) {
  if (bubble.includes('party-surface')) throw new Error('Debate surfaces must remain untinted')
}
requireFragments(bubbles[1], 'party summary separators', ['border-r border-solid border-fg/15', 'last:border-r-0'])
requireFragments(memberSpeechGroupRow, 'member speech surface', ['party-surface', "'--party-color'"])
for (const fragment of ['formatDateShort', 'group.date', 'group.speeches.length', 'group.shortCount', 't.contribution']) {
  if (memberSpeechGroupRow.includes(fragment)) throw new Error(`${fragment} must not return to MemberSpeechGroupRow`)
}
requireFragments(bubbles[0], 'highlighted member speech surface', [
  '70%, transparent',
  "borderWidth: highlighted ? '2px'",
])
for (const overlay of [reader, debateDialog, filterSheet]) {
  requireFragments(overlay, 'modal overlay', ['bg-black/40'])
}
requireFragments(filterSheet, 'FilterSheet.tsx', [
  "import { Filter, X } from 'lucide-react'",
  'overflow-y-auto',
  'sticky top-0',
  'border-b bg-background',
  'aria-label={t.close}',
  '<X size={17}',
  "if (e.key === 'Escape')",
  'fabRef.current?.focus()',
])
requireFragments(memberCard, 'MemberCard.tsx', ['bg-gradient-to-t from-black/70 to-transparent', 'text-white'])
requireFragments(nav, 'Nav.tsx', [
  'h-full max-w-3xl items-center gap-l px-l text-m',
  'hidden gap-l desk:flex',
  'hidden items-center gap-m desk:flex',
  'className="ml-auto desk:hidden"',
  'text-m desk:hidden',
  '<LanguagePicker',
  '<div className="mb-s text-s caption opacity-l">{t.language}</div>',
  'absolute inset-x-0 top-full',
  'max-h-[calc(100svh-54px)]',
  'overflow-y-auto overscroll-contain',
  'border-y border-fg/15 bg-background',
  'px-l py-l text-m',
])

if ((nav.match(/<LanguagePicker/g) ?? []).length !== 2) {
  throw new Error('Language picker must render once in desktop navigation and once in the mobile menu')
}
if (parties.includes('partySurfaceColor')) {
  throw new Error('Legacy background-only party speech surfaces must not return')
}
for (const [source, file] of [[rootRoute, '__root.tsx'], [nav, 'Nav.tsx'], [copy, 'lib/copy']]) {
  for (const fragment of ['machtblick.theme', 'useTheme', 'ThemePicker', 'themeLight', 'themeDark', 'matchMedia']) {
    if (source.includes(fragment)) throw new Error(`${fragment} must not return to ${file}`)
  }
}
for (const fragment of ['data-theme', 'prefers-color-scheme', 'color-scheme: dark']) {
  if (css.includes(fragment)) throw new Error(`${fragment} must not return to light-only styles`)
}
for (const fragment of ['dragY', 'startY', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'translateY']) {
  if (filterSheet.includes(fragment)) throw new Error(`${fragment} must not return to FilterSheet`)
}
for (const fragment of ['translate-y', 'transition-[height', 'transition-[transform']) {
  if (nav.includes(fragment)) throw new Error(`${fragment} must not enter the mobile navigation panel`)
}
if (stamp.includes('mixBlendMode')) throw new Error('Inline Stamp blending must not override the stamp blending contract')

console.log('Light-only web appearance, party speech surfaces, and member speech rows match their static contracts.')
