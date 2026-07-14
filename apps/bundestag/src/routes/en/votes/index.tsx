import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/en/votes/')({
  beforeLoad: ({ location }) => {
    throw redirect({ to: '/en/', search: location.search, statusCode: 301 })
  },
})
