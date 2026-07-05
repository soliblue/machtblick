import { useState } from 'react'

export function useReader<T>(items: T[]) {
  const [index, setIndex] = useState<number | null>(null)
  const active = index !== null && index < items.length ? items[index] : null
  const nextItem = index !== null && index + 1 < items.length ? items[index + 1] : null
  return {
    active,
    index: index ?? 0,
    count: items.length,
    nextItem,
    openAt: (i: number) => setIndex(i),
    close: () => setIndex(null),
    prev: active && index !== null && index > 0 ? () => setIndex(index - 1) : undefined,
    next: active && index !== null && index + 1 < items.length ? () => setIndex(index + 1) : undefined,
  }
}
