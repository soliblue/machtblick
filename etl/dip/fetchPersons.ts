import { paginate } from './client.ts'
import type { Person } from './types.ts'

export async function fetchWp21MdBs() {
  const out: Person[] = []
  for await (const p of paginate<Person>('/person', {
    'f.wahlperiode': '21',
    'f.funktion': 'MdB',
    'format': 'json',
  })) out.push(p)
  return out
}
