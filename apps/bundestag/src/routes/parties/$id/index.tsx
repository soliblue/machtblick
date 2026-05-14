import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/parties/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/parties/$id/profil/', params: { id: params.id } })
  },
})
