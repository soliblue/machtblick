import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { MemberSpeechesTab } from '@/views/memberDetail/MemberSpeechesTab'

export const Route = createFileRoute('/members/$id/speeches')({
  component: () => <MemberSpeechesTab data={useLoaderData({ from: '/members/$id' })} />,
})
