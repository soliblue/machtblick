import { createFileRoute } from '@tanstack/react-router'
import { Impressum } from '@/views/impressum/Impressum'
import { seoMeta, canonicalLink } from '@/lib/seo'

export const Route = createFileRoute('/en/imprint')({
  component: Impressum,
  head: () => ({
    meta: seoMeta({
      title: 'Imprint',
      description: 'Imprint for Machtblick: operator and contact, what the project is, and which data sources from the German Bundestag, abgeordnetenwatch, and Wikimedia it uses.',
      canonical: '/en/imprint',
    }),
    links: canonicalLink('/en/imprint'),
  }),
})
