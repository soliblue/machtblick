import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/en/parties/$id/votes')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/en/parties/$id/', params, replace: true })
  },
})
