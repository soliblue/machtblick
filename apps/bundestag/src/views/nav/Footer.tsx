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
      <div className="mx-auto flex max-w-3xl flex-wrap justify-end gap-l px-l py-l text-s">
        <a href={withLocale('/motions/', locale)} className={linkClass}>{t.navMotions}</a>
        <a href={withLocale('/speeches/', locale)} className={linkClass}>{t.navSpeeches}</a>
        <a href={withLocale('/methodology/', locale)} className={linkClass}>{t.aboutData}</a>
        <a href="https://apps.apple.com/us/app/machtblick/id6787755187" className={linkClass}>{t.appStoreLink}</a>
        <a
          href="https://github.com/soliblue/machtblick"
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          {t.sourceCode}
        </a>
        <a href={withLocale('/imprint/', locale)} className={linkClass}>{t.imprint}</a>
        <a href={withLocale('/privacy/', locale)} className={linkClass}>{t.privacy}</a>
      </div>
    </footer>
  )
}
