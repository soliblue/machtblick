import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/en/members/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/en/members/$id/votes/', params: { id: params.id } })
  },
})
