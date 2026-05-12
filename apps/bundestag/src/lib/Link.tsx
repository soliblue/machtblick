import { Link as TanStackLink } from '@tanstack/react-router'

export const Link = ((props: Parameters<typeof TanStackLink>[0]) => (
  <TanStackLink reloadDocument {...props} />
)) as typeof TanStackLink
