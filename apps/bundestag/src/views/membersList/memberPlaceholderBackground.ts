const BACKGROUNDS = [
  'member-placeholder-blue',
  'member-placeholder-purple',
  'member-placeholder-orange',
  'member-placeholder-cyan',
  'member-placeholder-pink',
  'member-placeholder-teal',
  'member-placeholder-indigo',
  'member-placeholder-rust',
] as const

const UTF8 = new TextEncoder()

export function memberPlaceholderBackground(memberId: string) {
  let index = 0
  for (const byte of UTF8.encode(memberId)) index = (index * 31 + byte) % BACKGROUNDS.length
  return BACKGROUNDS[index]
}
