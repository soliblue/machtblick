import { useSyncExternalStore } from 'react'

export const VOTE_FLAG_FILTERS = ['all', 'saved', 'seen', 'unseen'] as const

export type VoteFlagFilter = typeof VOTE_FLAG_FILTERS[number]

type VoteFlagsSnapshot = {
  savedIds: ReadonlySet<string>
  seenIds: ReadonlySet<string>
}

const savedKey = 'machtblick.savedVotes'
const seenKey = 'machtblick.seenVotes'
const emptySnapshot: VoteFlagsSnapshot = { savedIds: new Set(), seenIds: new Set() }
const listeners = new Set<() => void>()

let snapshot = emptySnapshot
let initialized = false

function readIds(key: string) {
  return new Set(JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[])
}

function writeIds(key: string, ids: ReadonlySet<string>) {
  window.localStorage.setItem(key, JSON.stringify(Array.from(ids)))
}

function readSnapshot(): VoteFlagsSnapshot {
  return { savedIds: readIds(savedKey), seenIds: readIds(seenKey) }
}

function emit() {
  for (const listener of listeners) listener()
}

function ensureInitialized() {
  if (typeof window !== 'undefined' && !initialized) {
    initialized = true
    snapshot = readSnapshot()
    window.addEventListener('storage', (event) => {
      if (event.storageArea === window.localStorage && (event.key === savedKey || event.key === seenKey || event.key === null)) {
        snapshot = readSnapshot()
        emit()
      }
    })
  }
}

function subscribe(listener: () => void) {
  ensureInitialized()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  ensureInitialized()
  return snapshot
}

function getServerSnapshot() {
  return emptySnapshot
}

function toggled(ids: ReadonlySet<string>, id: string) {
  const next = new Set(ids)
  next.has(id) ? next.delete(id) : next.add(id)
  return next
}

function toggleSaved(id: string) {
  ensureInitialized()
  const savedIds = toggled(snapshot.savedIds, id)
  writeIds(savedKey, savedIds)
  snapshot = { ...snapshot, savedIds }
  emit()
}

function toggleSeen(id: string) {
  ensureInitialized()
  const seenIds = toggled(snapshot.seenIds, id)
  writeIds(seenKey, seenIds)
  snapshot = { ...snapshot, seenIds }
  emit()
}

export function useVoteFlags() {
  const flags = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return { ...flags, toggleSaved, toggleSeen }
}
