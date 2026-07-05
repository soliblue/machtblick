import { existsSync, readFileSync } from 'node:fs'

const manifestUrl = new URL('../../public/members-photos/manifest.json', import.meta.url)
const manifest: Record<string, { file: string }> = existsSync(manifestUrl) ? JSON.parse(readFileSync(manifestUrl, 'utf8')) : {}

export function resolvePictureUrl<T extends string | null>(memberId: string, pictureUrl: T): string | T {
  return manifest[memberId]?.file ?? pictureUrl
}
