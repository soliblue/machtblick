import { Link } from '@/lib/Link'

export function Datenschutz() {
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="mb-xl text-xxl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Datenschutz</h1>
      <p className="mb-l max-w-[65ch] text-m">
        Diese Seite erhebt keine personenbezogenen Daten. Es gibt keine Analyse-Werkzeuge, keine Cookies,
        kein Tracking, keine Konten, keine Formulare. Die{' '}
        <Link to="/impressum/" hash="kontakt" className="hover:underline">im Impressum genannten Kontaktadressen</Link>{' '}
        werden ausschließlich verwendet, um auf die jeweils gesendete Nachricht zu antworten.
      </p>
      <p className="mt-xl text-s opacity-l">Stand: 14. Mai 2026</p>
    </main>
  )
}
