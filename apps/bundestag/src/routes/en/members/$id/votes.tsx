import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/en/members/$id/votes')({
  beforeLoad: ({ location, params }) => {
    throw redirect({ to: '/en/members/$id/', params, search: location.search, statusCode: 301 })
  },
})
