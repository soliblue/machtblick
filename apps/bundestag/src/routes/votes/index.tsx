import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/votes/')({
  beforeLoad: ({ location }) => {
    throw redirect({ to: '/', search: location.search, statusCode: 301 })
  },
})
