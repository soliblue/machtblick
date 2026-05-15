import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

const linkClass = 'opacity-l hover:opacity-100 [&.active]:opacity-100 [&.active]:font-semibold'

export function Footer() {
  const locale = useLocale()
  const t = useCopy()
  return (
    <footer
      className="mt-xl"
      style={{ borderTop: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <div className="mx-auto flex max-w-3xl justify-end gap-l px-l py-l text-s">
        <a href={withLocale('/impressum/', locale)} className={linkClass}>{t.imprint}</a>
        <a href={withLocale('/datenschutz/', locale)} className={linkClass}>{t.privacy}</a>
      </div>
    </footer>
  )
}
