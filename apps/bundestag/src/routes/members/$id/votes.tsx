import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/members/$id/votes')({
  beforeLoad: ({ location, params }) => {
    throw redirect({ to: '/members/$id/', params, search: location.search, statusCode: 301 })
  },
})
