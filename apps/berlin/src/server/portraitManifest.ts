import { existsSync, readFileSync } from 'node:fs'

const manifestPath = [
  `${process.cwd()}/public/candidate-portraits/manifest.json`,
  new URL('../../public/candidate-portraits/manifest.json', import.meta.url).pathname
].find(existsSync)
const manifest: Record<string, { file: string }> = manifestPath ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}

export function resolvePortraitUrl<T extends string | null>(
  candidateSlug: string,
  portraitUrl: T,
  entries: Record<string, { file: string }> = manifest
): string | T {
  return entries[candidateSlug]?.file ?? portraitUrl
}
