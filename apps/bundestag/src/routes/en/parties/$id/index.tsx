import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/en/parties/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/en/parties/$id/profil/', params: { id: params.id } })
  },
})
