import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/members/$id/motions')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/members/$id/votes/', params })
  },
})
