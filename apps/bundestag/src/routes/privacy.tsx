import { createFileRoute } from '@tanstack/react-router'
import { Datenschutz } from '@/views/datenschutz/Datenschutz'
import { seoMeta, canonicalLink } from '@/lib/seo'

export const Route = createFileRoute('/privacy')({
  component: Datenschutz,
  head: () => ({
    meta: seoMeta({
      title: 'Datenschutz',
      description: 'Datenschutzerklärung von Machtblick: keine Erhebung personenbezogener Daten.',
      canonical: '/privacy',
    }),
    links: canonicalLink('/privacy'),
  }),
})
