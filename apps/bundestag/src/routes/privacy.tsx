import { createFileRoute } from '@tanstack/react-router'
import { Datenschutz } from '@/views/datenschutz/Datenschutz'
import { seoMeta, canonicalLink } from '@/lib/seo'

export const Route = createFileRoute('/privacy')({
  component: Datenschutz,
  head: () => ({
    meta: seoMeta({
      title: 'Datenschutz',
      description: 'Datenschutzerklärung von Machtblick: Diese Seite erhebt keine personenbezogenen Daten und verwendet keine Cookies, kein Tracking und keine Analyse-Werkzeuge.',
      canonical: '/privacy',
    }),
    links: canonicalLink('/privacy'),
  }),
})
