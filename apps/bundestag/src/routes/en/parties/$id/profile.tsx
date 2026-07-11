import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/en/parties/$id/profile')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/en/parties/$id/', params: { id: params.id }, replace: true })
  },
})
