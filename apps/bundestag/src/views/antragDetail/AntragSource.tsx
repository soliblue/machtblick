import { ExternalLink } from 'lucide-react'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = {
  pdfUrl: string | null
}

export function AntragSource({ pdfUrl }: Props) {
  const locale = useLocale()
  const t = useCopy()
  return (
    <section className="mt-xl text-s opacity-l">
      {pdfUrl ? (
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs underline-offset-4 hover:underline">
          <span>{locale === 'en' ? 'Motion as PDF' : 'Antrag als PDF'}</span>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      ) : null}
      <p className={pdfUrl ? 'mt-s' : ''}>
        <a href="https://dip.bundestag.de" target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs underline-offset-4 hover:underline">
          <span>{t.dipSource}</span>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </p>
    </section>
  )
}
