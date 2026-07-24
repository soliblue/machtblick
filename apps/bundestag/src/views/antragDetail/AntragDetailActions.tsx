import { FileText } from 'lucide-react'
import type { AntragDetail } from '@/server/antraege'
import { useCopy } from '@/lib/i18n'

type Props = {
  pdfUrl: string | null
  documentType: AntragDetail['antrag']['type']
}

export function AntragDetailActions({ pdfUrl, documentType }: Props) {
  const t = useCopy()
  const label = documentType === 'gesetzentwurf' ? t.billPdf : t.motionPdf
  return (
    <div className="flex items-center gap-xs justify-self-end">
      {pdfUrl ? (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          title={label}
          className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-m border border-fg/15 bg-background opacity-l transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <FileText size={17} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  )
}
