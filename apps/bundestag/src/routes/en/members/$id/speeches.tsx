import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { MemberSpeechesSection } from '@/views/memberDetail/MemberSpeechesSection'

export const Route = createFileRoute('/en/members/$id/speeches')({
  component: RedenRoute,
})

function RedenRoute() {
  const data = useLoaderData({ from: '/en/members/$id' })
  const speeches = data?.speeches ?? []
  return speeches.length > 0 ? (
    <MemberSpeechesSection speeches={speeches} />
  ) : (
    <div className="border p-xl text-center text-m opacity-l" style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}>
      <div className="font-semibold opacity-100">No speeches in term 21</div>
    </div>
  )
}
