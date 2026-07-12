import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/parties/$id/votes')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/parties/$id/', params, replace: true })
  },
})
