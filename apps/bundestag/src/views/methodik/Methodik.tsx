import { useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { COPY } from './methodikCopy'

const CAPTION = 'mt-xl mb-m text-s caption opacity-l'
const PROSE = 'mb-m max-w-[65ch] text-m'
const EXTERNAL = 'opacity-l underline-offset-2 hover:underline'

export function Methodik() {
  const locale = useLocale()
  const c = COPY[locale]
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="mb-xl text-xxl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{c.title}</h1>

      <h2 className={CAPTION}>{c.sourcesHeading}</h2>
      <div className="max-w-[65ch] pl-m">
        {c.sources.map((s) => (
          <div key={s.name} className="mb-m">
            <div className="text-m">{s.name}</div>
            <a href={s.url} target="_blank" rel="noopener" className={`${EXTERNAL} block text-m`}>{s.display}</a>
            <div className="text-s opacity-l">{s.desc}</div>
          </div>
        ))}
      </div>

      <h2 className={CAPTION}>{c.refreshHeading}</h2>
      <p className={PROSE}>{c.refreshBody}</p>

      <h2 className={CAPTION}>{c.aiHeading}</h2>
      <p className={PROSE}>{c.aiBody}</p>

      <h2 className={CAPTION}>{c.operatorHeading}</h2>
      <p className={PROSE}>
        {c.operatorBefore}
        <a href={withLocale('/imprint/', locale)} className="underline underline-offset-4">{c.operatorLink}</a>
        {c.operatorAfter}
      </p>
    </main>
  )
}
