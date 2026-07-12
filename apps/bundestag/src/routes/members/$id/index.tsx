import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/members/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/members/$id/votes/', params })
  },
})
