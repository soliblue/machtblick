import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/en/')({
  beforeLoad: () => {
    throw redirect({ to: '/en/votes/' })
  },
})
