import { useLocale } from '@/lib/i18n'

export function Datenschutz() {
  const locale = useLocale()
  return locale === 'en' ? (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="mb-xl text-xxl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Privacy</h1>
      <p className="mb-l max-w-[65ch] text-m">
        This site does not collect personal data. There are no analytics tools, no cookies,
        no tracking, no accounts, and no forms. The{' '}
        <a href="/en/imprint/#kontakt" className="hover:underline">contact addresses listed in the imprint</a>{' '}
        are used only to reply to the message sent to them.
      </p>
      <p className="mt-xl text-s opacity-l">Last updated: May 14, 2026</p>
    </main>
  ) : (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="mb-xl text-xxl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Datenschutz</h1>
      <p className="mb-l max-w-[65ch] text-m">
        Diese Seite erhebt keine personenbezogenen Daten. Es gibt keine Analyse-Werkzeuge, keine Cookies,
        kein Tracking, keine Konten, keine Formulare. Die{' '}
        <a href="/imprint/#kontakt" className="hover:underline">im Impressum genannten Kontaktadressen</a>{' '}
        werden ausschließlich verwendet, um auf die jeweils gesendete Nachricht zu antworten.
      </p>
      <p className="mt-xl text-s opacity-l">Stand: 14. Mai 2026</p>
    </main>
  )
}
