import { useLocale } from '@/lib/i18n'
import { COPY, type Source } from './impressumCopy'

const CAPTION = 'mt-xl mb-m text-s caption opacity-l'
const PROSE = 'mb-m max-w-[65ch] text-m'
const EXTERNAL = 'opacity-l underline-offset-2 hover:underline'

function SourceList({ sources }: { sources: Source[] }) {
  return (
    <>
      {sources.map((s) => (
        <div key={s.name} className="mb-m">
          <div className="text-m">{s.name}</div>
          <a href={s.url} target="_blank" rel="noopener" className={`${EXTERNAL} block text-m`}>{s.display}</a>
          <div className="text-s opacity-l">{s.desc}</div>
        </div>
      ))}
    </>
  )
}

export function Impressum() {
  const c = COPY[useLocale()]
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="mb-xl text-xxl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{c.title}</h1>

      <h2 className={CAPTION}>{c.whatHeading}</h2>
      <p className={PROSE}>{c.whatBody}</p>

      <h2 className={CAPTION}>{c.sourcesHeading}</h2>

      <h3 className="mt-l mb-s text-m font-semibold">{c.bundestagHeading}</h3>
      <div className="max-w-[65ch] pl-m">
        <SourceList sources={c.sourcesBundestag} />
        <p className="mt-s text-s opacity-m">{c.licenseNote}</p>
      </div>

      <h3 className="mt-l mb-s text-m font-semibold">abgeordnetenwatch</h3>
      <div className="max-w-[65ch] pl-m">
        <div className="mb-m">
          <div className="text-m">
            <a href="https://www.abgeordnetenwatch.de/" target="_blank" rel="noopener" className={EXTERNAL}>abgeordnetenwatch.de</a>
          </div>
          <div className="text-s opacity-l">{c.abgeordnetenwatchDesc}</div>
        </div>
      </div>

      <h3 className="mt-l mb-s text-m font-semibold">{c.imagesHeading}</h3>
      <div className="max-w-[65ch] pl-m">
        <SourceList sources={c.sourcesImages} />
      </div>

      <h2 className={CAPTION}>{c.principlesHeading}</h2>
      <p className={PROSE}>{c.principlesBody}</p>

      <h2 id="kontakt" className={CAPTION}>{c.contactHeading}</h2>
      <dl className="max-w-[65ch]">
        {c.contacts.map((contact) => (
          <div key={contact.email} className="mb-s flex gap-l text-m">
            <dt className="w-[8rem] shrink-0 opacity-l">{contact.label}</dt>
            <dd>
              <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
            </dd>
          </div>
        ))}
      </dl>

      <h2 className={CAPTION}>{c.operatorHeading}</h2>
      <p className={PROSE}>{c.operatorBody}</p>
    </main>
  )
}
