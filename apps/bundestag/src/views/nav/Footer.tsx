import { Link } from '@/lib/Link'

const linkClass = 'opacity-l hover:opacity-100 [&.active]:opacity-100 [&.active]:font-semibold'

export function Footer() {
  return (
    <footer
      className="mt-xl"
      style={{ borderTop: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <div className="mx-auto flex max-w-3xl justify-end gap-l px-l py-l text-s">
        <Link to="/impressum/" className={linkClass}>Impressum</Link>
        <Link to="/datenschutz/" className={linkClass}>Datenschutz</Link>
      </div>
    </footer>
  )
}
