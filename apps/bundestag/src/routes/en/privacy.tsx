import { createFileRoute } from '@tanstack/react-router'
import { Datenschutz } from '@/views/datenschutz/Datenschutz'
import { seoMeta, canonicalLink } from '@/lib/seo'

export const Route = createFileRoute('/en/privacy')({
  component: Datenschutz,
  head: () => ({
    meta: seoMeta({
      title: 'Privacy',
      description: 'Privacy statement for Machtblick: no collection of personal data.',
      canonical: '/en/privacy',
    }),
    links: canonicalLink('/en/privacy'),
  }),
})
