import { createFileRoute } from '@tanstack/react-router'
import { Impressum } from '@/views/impressum/Impressum'
import { seoMeta, canonicalLink } from '@/lib/seo'

export const Route = createFileRoute('/en/imprint')({
  component: Impressum,
  head: () => ({
    meta: seoMeta({
      title: 'Imprint',
      description: 'Imprint for Machtblick: project description, data sources, and contact.',
      canonical: '/en/imprint',
    }),
    links: canonicalLink('/en/imprint'),
  }),
})
