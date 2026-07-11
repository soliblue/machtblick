import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { MemberSpeechesSection } from '@/views/memberDetail/MemberSpeechesSection'

export const Route = createFileRoute('/members/$id/speeches')({
  component: RedenRoute,
})

function RedenRoute() {
  const data = useLoaderData({ from: '/members/$id' })
  const speeches = data?.speeches ?? []
  return speeches.length > 0 ? (
    <MemberSpeechesSection speeches={speeches} memberId={data.id} memberParty={data.party} />
  ) : (
    <div className="rounded-m border p-xl text-center text-m opacity-l" style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}>
      <div className="font-semibold opacity-100">Keine Reden in WP21</div>
    </div>
  )
}
