import { useLocale } from '@/lib/i18n'

export function NotFoundPage() {
  const locale = useLocale()
  return (
    <main className="mx-auto max-w-3xl p-l">
      <section
        className="rounded-m border p-xl text-center"
        style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
      >
        <h1 className="text-xl font-semibold">{locale === 'en' ? 'This page does not exist.' : 'Diese Seite gibt es nicht.'}</h1>
        <a
          href={locale === 'en' ? '/en/' : '/'}
          className="mt-l inline-flex rounded-m border px-m py-s text-m transition-colors hover:bg-surface"
          style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
        >
          {locale === 'en' ? 'Back to votes' : 'Zurück zu den Abstimmungen'}
        </a>
      </section>
    </main>
  )
}
