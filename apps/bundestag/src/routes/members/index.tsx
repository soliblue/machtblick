import { createFileRoute } from '@tanstack/react-router'
import { listMembers } from '@/server/members'
import { MembersRouteBody } from '@/views/membersList/MembersRouteBody'
import { validateMembersSearch } from '@/lib/searchParams'
import { membersListHead } from '@/lib/routeHeads'

export const Route = createFileRoute('/members/')({
  component: () => <MembersRouteBody from="/members/" />,
  loader: () => listMembers(),
  head: () => membersListHead('de'),
  validateSearch: validateMembersSearch,
})
