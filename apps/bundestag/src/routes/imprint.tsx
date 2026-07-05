import { createFileRoute } from '@tanstack/react-router'
import { Impressum } from '@/views/impressum/Impressum'
import { seoMeta, canonicalLink } from '@/lib/seo'

export const Route = createFileRoute('/imprint')({
  component: Impressum,
  head: () => ({
    meta: seoMeta({
      title: 'Impressum',
      description: 'Impressum von Machtblick: Betreiber und Kontakt, was das Projekt ist und welche Datenquellen des Deutschen Bundestags, von abgeordnetenwatch und Wikimedia es nutzt.',
      canonical: '/imprint',
    }),
    links: canonicalLink('/imprint'),
  }),
})
