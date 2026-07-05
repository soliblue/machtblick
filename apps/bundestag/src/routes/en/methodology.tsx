import { createFileRoute } from '@tanstack/react-router'
import { Methodik } from '@/views/methodik/Methodik'
import { seoMeta, canonicalLink, breadcrumbJsonLd } from '@/lib/seo'

export const Route = createFileRoute('/en/methodology')({
  component: Methodik,
  head: () => ({
    meta: seoMeta({
      title: 'About the data',
      description: 'How Machtblick works: roll call votes and member data from bundestag.de, motions via the DIP API, weekly refresh, and disclosure of AI-generated summaries.',
      canonical: '/en/methodology',
    }),
    links: canonicalLink('/en/methodology'),
    scripts: breadcrumbJsonLd([{ name: 'Machtblick', path: '/en' }, { name: 'About the data', path: '/en/methodology' }]),
  }),
})
