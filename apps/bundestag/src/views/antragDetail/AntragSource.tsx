import { ExternalLink } from 'lucide-react'
import { useCopy } from '@/lib/i18n'

export function AntragSource() {
  const t = useCopy()
  return (
    <section className="mt-xl rounded-m bg-surface p-m text-s">
      <p>
        <a href="https://dip.bundestag.de" target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs underline-offset-4 hover:underline">
          <span>{t.dipSource}</span>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </p>
    </section>
  )
}
