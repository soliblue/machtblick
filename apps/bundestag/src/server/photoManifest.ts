import { existsSync, readFileSync } from 'node:fs'

const manifestPath = [
  `${process.cwd()}/public/members-photos/manifest.json`,
  new URL('../../public/members-photos/manifest.json', import.meta.url).pathname,
].find(existsSync)
const manifest: Record<string, { file: string }> = manifestPath ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}

export function resolvePictureUrl<T extends string | null>(memberId: string, pictureUrl: T): string | T {
  return manifest[memberId]?.file ?? pictureUrl
}
