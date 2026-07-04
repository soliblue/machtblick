import { useQuery } from '@tanstack/react-query'
import { loadSpeechPeople } from '@/lib/speechesStatic'

export function useSpeechPeople() {
  return useQuery({
    queryKey: ['speech-people'],
    queryFn: loadSpeechPeople,
    staleTime: Infinity,
  }).data ?? {}
}
