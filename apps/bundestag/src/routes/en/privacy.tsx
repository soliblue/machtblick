import { createFileRoute } from '@tanstack/react-router'
import { Datenschutz } from '@/views/datenschutz/Datenschutz'
import { seoMeta, canonicalLink } from '@/lib/seo'

export const Route = createFileRoute('/en/privacy')({
  component: Datenschutz,
  head: () => ({
    meta: seoMeta({
      title: 'Privacy',
      description: 'Privacy statement for Machtblick: this site collects no personal data and uses no cookies, no tracking, no analytics tools, and no user accounts.',
      canonical: '/en/privacy',
    }),
    links: canonicalLink('/en/privacy'),
  }),
})
