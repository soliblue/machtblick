import { createFileRoute } from '@tanstack/react-router'
import { Methodik } from '@/views/methodik/Methodik'
import { seoMeta, canonicalLink } from '@/lib/seo'

export const Route = createFileRoute('/methodology')({
  component: Methodik,
  head: () => ({
    meta: seoMeta({
      title: 'Über die Daten',
      description: 'Namentliche Abstimmungen und Abgeordnetendaten von bundestag.de, Anträge über die DIP-API, wöchentlich aktualisiert, mit KI-Hinweis zu Zusammenfassungen.',
      canonical: '/methodology',
    }),
    links: canonicalLink('/methodology'),
  }),
})
