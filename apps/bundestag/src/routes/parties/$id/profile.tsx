import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/parties/$id/profile')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/parties/$id/', params: { id: params.id }, replace: true })
  },
})
