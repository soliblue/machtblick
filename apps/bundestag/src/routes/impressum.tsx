import { createFileRoute } from '@tanstack/react-router'
import { Impressum } from '@/views/impressum/Impressum'
import { seoMeta, canonicalLink } from '@/lib/seo'

export const Route = createFileRoute('/impressum')({
  component: Impressum,
  head: () => ({
    meta: seoMeta({
      title: 'Impressum',
      description: 'Impressum von Machtblick: Projektbeschreibung, Datenquellen und Kontakt.',
      canonical: '/impressum',
    }),
    links: canonicalLink('/impressum'),
  }),
})
