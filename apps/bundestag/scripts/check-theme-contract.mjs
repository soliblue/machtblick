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
const themeHook = read('apps/bundestag/src/hooks/useTheme.ts')
const picker = read('apps/bundestag/src/views/nav/ThemePicker.tsx')
const nav = read('apps/bundestag/src/views/nav/Nav.tsx')
const css = read('apps/bundestag/src/styles/globals.css')
const copy = read('apps/bundestag/src/lib/i18n.tsx')
const parties = read('apps/bundestag/src/lib/parties.ts')
const bubbles = [
  read('apps/bundestag/src/views/speeches/ConversationBubble.tsx'),
  read('apps/bundestag/src/views/voteDetail/PartySummaryPreviewList.tsx'),
  read('apps/bundestag/src/views/memberDetail/MemberSpeechGroupRow.tsx'),
]
const reader = read('apps/bundestag/src/views/speeches/Reader.tsx')
const debateDialog = read('apps/bundestag/src/views/memberDetail/MemberDebateDialog.tsx')
const filterSheet = read('apps/bundestag/src/views/votesList/FilterSheet.tsx')
const memberCard = read('apps/bundestag/src/views/membersList/MemberCard.tsx')

requireFragments(rootRoute, '__root.tsx', [
  "localStorage.getItem('machtblick.theme')",
  "matchMedia('(prefers-color-scheme: dark)')",
  'document.documentElement.dataset.theme',
  'suppressHydrationWarning',
  '<Nav theme={theme.theme} onThemeChange={theme.selectTheme} />',
])
requireFragments(themeHook, 'useTheme.ts', [
  "export type ThemeMode = 'system' | 'light' | 'dark'",
  "const STORAGE_KEY = 'machtblick.theme'",
  "window.localStorage.removeItem(STORAGE_KEY)",
  "window.localStorage.setItem(STORAGE_KEY, next)",
  "media.addEventListener('change', sync)",
  "media.removeEventListener('change', sync)",
])
requireFragments(picker, 'ThemePicker.tsx', [
  'role="radiogroup"',
  'aria-label={label}',
  'type="radio"',
  '<Monitor size={14}',
  '<Sun size={14}',
  '<Moon size={14}',
  'checked={value === \'system\'}',
  'checked={value === \'light\'}',
  'checked={value === \'dark\'}',
])
requireFragments(css, 'globals.css', [
  ":root[data-theme='light']",
  ":root[data-theme='dark']",
  '--color-background: #000000',
  '--color-surface: #1C1C1E',
  '--color-elevated: #2C2C2E',
  '--color-fg: #FFFFFF',
])
requireFragments(copy, 'i18n.tsx', [
  "appearance: 'Darstellung'",
  "themeLight: 'Hell'",
  "themeDark: 'Dunkel'",
  "appearance: 'Appearance'",
  "themeLight: 'Light'",
  "themeDark: 'Dark'",
])
requireFragments(parties, 'parties.ts', [
  'export const partySurfaceColor',
  '10%, var(--color-background)',
])
for (const bubble of bubbles) requireFragments(bubble, 'party speech surface', ['partySurfaceColor'])
for (const overlay of [reader, debateDialog, filterSheet]) {
  requireFragments(overlay, 'dark-safe modal overlay', ['bg-black/40'])
}
requireFragments(memberCard, 'MemberCard.tsx', ['bg-gradient-to-t from-black/70 to-transparent', 'text-white'])
requireFragments(nav, 'Nav.tsx', [
  'hidden gap-l desk:flex',
  'hidden items-center gap-m desk:flex',
  'className="ml-auto desk:hidden"',
  'text-m desk:hidden',
])

if ((nav.match(/<ThemePicker/g) ?? []).length !== 2) {
  throw new Error('Theme picker must render once in desktop navigation and once in the mobile menu')
}
if (nav.indexOf('<ThemePicker') > nav.indexOf('aria-label={t.language}')) {
  throw new Error('Desktop theme picker must precede the language picker')
}

console.log('Website theme selection and subdued party speech surfaces match their static contract.')
