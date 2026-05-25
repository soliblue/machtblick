import { useLocale } from '@/lib/i18n'

const SOURCES_BUNDESTAG = [
  {
    name: 'Stammdaten',
    url: 'https://www.bundestag.de/services/opendata',
    display: 'bundestag.de',
    desc: 'Stammdaten der Abgeordneten',
  },
  {
    name: 'Plenarprotokolle',
    url: 'https://dserver.bundestag.de/',
    display: 'dserver.bundestag.de',
    desc: 'Reden und Protokolle der Plenarsitzungen',
  },
  {
    name: 'Parlamentaria',
    url: 'https://www.bundestag.de/parlament/praesidium/parteienfinanzierung',
    display: 'bundestag.de',
    desc: 'Parteispenden über 50.000 Euro',
  },
  {
    name: 'DIP',
    url: 'https://search.dip.bundestag.de/',
    display: 'search.dip.bundestag.de',
    desc: 'Anträge und Drucksachen',
  },
]

const SOURCES_IMAGES = [
  {
    name: 'Wikidata',
    url: 'https://query.wikidata.org/',
    display: 'query.wikidata.org',
    desc: 'Porträtverweise (P18), CC0',
  },
  {
    name: 'Wikimedia Commons',
    url: 'https://commons.wikimedia.org/',
    display: 'commons.wikimedia.org',
    desc: 'Porträtdateien, Lizenzen je Datei mitgespeichert',
  },
]

const CONTACTS = [
  { label: 'Fragen', email: 'hello@machtblick.de' },
  { label: 'Feedback', email: 'feedback@machtblick.de' },
  { label: 'Mitmachen', email: 'mitmachen@machtblick.de' },
]

const CAPTION = 'mt-xl mb-m text-s uppercase opacity-l'
const PROSE = 'mb-m max-w-[65ch] text-m'
const EXTERNAL = 'opacity-l underline-offset-2 hover:underline'

export function Impressum() {
  const locale = useLocale()
  if (locale === 'en') {
    return (
      <main className="mx-auto max-w-3xl p-l">
        <h1 className="mb-xl text-xxl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Imprint</h1>

        <h2 className={CAPTION} style={{ letterSpacing: '0.08em' }}>What Machtblick is</h2>
        <p className={PROSE}>
          Machtblick is the project of one German citizen building AI-assisted tools that make the work
          of the Bundestag and the Federal Government easier to access. No commentary, no political
          position, no activism. The aim is to translate public sources into an interface that the public
          can actually use.
        </p>

        <h2 className={CAPTION} style={{ letterSpacing: '0.08em' }}>Data sources</h2>

        <h3 className="mt-l mb-s text-m font-semibold">German Bundestag</h3>
        <div className="max-w-[65ch] pl-m">
          {[
            { name: 'Master data', url: 'https://www.bundestag.de/services/opendata', display: 'bundestag.de', desc: 'Member master data' },
            { name: 'Plenary records', url: 'https://dserver.bundestag.de/', display: 'dserver.bundestag.de', desc: 'Speeches and plenary records' },
            { name: 'Parlamentaria', url: 'https://www.bundestag.de/parlament/praesidium/parteienfinanzierung', display: 'bundestag.de', desc: 'Party donations above 50,000 euros' },
            { name: 'DIP', url: 'https://search.dip.bundestag.de/', display: 'search.dip.bundestag.de', desc: 'Motions and parliamentary papers' },
          ].map((s) => (
            <div key={s.name} className="mb-m">
              <div className="text-m">{s.name}</div>
              <a href={s.url} target="_blank" rel="noopener" className={`${EXTERNAL} block text-m`}>{s.display}</a>
              <div className="text-s opacity-l">{s.desc}</div>
            </div>
          ))}
          <p className="mt-s text-s opacity-m">
            Sources without an explicit license notice are publicly available data from the German Bundestag.
          </p>
        </div>

        <h3 className="mt-l mb-s text-m font-semibold">abgeordnetenwatch</h3>
        <div className="max-w-[65ch] pl-m">
          <div className="mb-m">
            <div className="text-m">
              <a href="https://www.abgeordnetenwatch.de/" target="_blank" rel="noopener" className={EXTERNAL}>abgeordnetenwatch.de</a>
            </div>
            <div className="text-s opacity-l">Profiles, party changes, portrait references</div>
          </div>
        </div>

        <h3 className="mt-l mb-s text-m font-semibold">Images</h3>
        <div className="max-w-[65ch] pl-m">
          {[
            { name: 'Wikidata', url: 'https://query.wikidata.org/', display: 'query.wikidata.org', desc: 'Portrait references (P18), CC0' },
            { name: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/', display: 'commons.wikimedia.org', desc: 'Portrait files, licenses stored per file' },
          ].map((s) => (
            <div key={s.name} className="mb-m">
              <div className="text-m">{s.name}</div>
              <a href={s.url} target="_blank" rel="noopener" className={`${EXTERNAL} block text-m`}>{s.display}</a>
              <div className="text-s opacity-l">{s.desc}</div>
            </div>
          ))}
        </div>

        <h2 className={CAPTION} style={{ letterSpacing: '0.08em' }}>Principles</h2>
        <p className={PROSE}>
          No commentary, no bias against any group, no activism. Just easier access to information
          from sources made public by people doing valuable work.
        </p>

        <h2 id="kontakt" className={CAPTION} style={{ letterSpacing: '0.08em' }}>Contact</h2>
        <dl className="max-w-[65ch]">
          {[
            { label: 'Questions', email: 'hello@machtblick.de' },
            { label: 'Feedback', email: 'feedback@machtblick.de' },
            { label: 'Contribute', email: 'mitmachen@machtblick.de' },
          ].map((c) => (
            <div key={c.email} className="mb-s flex gap-l text-m">
              <dt className="w-[8rem] shrink-0 opacity-l">{c.label}</dt>
              <dd>
                <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
              </dd>
            </div>
          ))}
        </dl>

        <h2 className={CAPTION} style={{ letterSpacing: '0.08em' }}>About the operator</h2>
        <p className={PROSE}>
          For privacy reasons, the name and address of the operator are not published here.
          If the project gains wider distribution, this will be adjusted.
        </p>
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="mb-xl text-xxl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Impressum</h1>

      <h2 className={CAPTION} style={{ letterSpacing: '0.08em' }}>Was ist Machtblick</h2>
      <p className={PROSE}>
        Machtblick ist das Projekt eines einzelnen deutschen Bürgers, der mit Hilfe von KI Werkzeuge baut,
        die die Arbeit des Bundestages und der Regierung zugänglicher machen. Keine Kommentare, keine
        politische Position, kein Aktivismus. Es geht darum, öffentliche Quellen in eine Oberfläche zu
        übersetzen, die für die Allgemeinheit nutzbar ist.
      </p>

      <h2 className={CAPTION} style={{ letterSpacing: '0.08em' }}>Datenquellen</h2>

      <h3 className="mt-l mb-s text-m font-semibold">Deutscher Bundestag</h3>
      <div className="max-w-[65ch] pl-m">
        {SOURCES_BUNDESTAG.map((s) => (
          <div key={s.name} className="mb-m">
            <div className="text-m">{s.name}</div>
            <a href={s.url} target="_blank" rel="noopener" className={`${EXTERNAL} block text-m`}>{s.display}</a>
            <div className="text-s opacity-l">{s.desc}</div>
          </div>
        ))}
        <p className="mt-s text-s opacity-m">
          Quellen ohne explizite Lizenzangabe sind öffentlich zugängliche Daten des Deutschen Bundestages.
        </p>
      </div>

      <h3 className="mt-l mb-s text-m font-semibold">abgeordnetenwatch</h3>
      <div className="max-w-[65ch] pl-m">
        <div className="mb-m">
          <div className="text-m">
            <a href="https://www.abgeordnetenwatch.de/" target="_blank" rel="noopener" className={EXTERNAL}>abgeordnetenwatch.de</a>
          </div>
          <div className="text-s opacity-l">Profile, Fraktionswechsel, Porträtverweise</div>
        </div>
      </div>

      <h3 className="mt-l mb-s text-m font-semibold">Bilder</h3>
      <div className="max-w-[65ch] pl-m">
        {SOURCES_IMAGES.map((s) => (
          <div key={s.name} className="mb-m">
            <div className="text-m">{s.name}</div>
            <a href={s.url} target="_blank" rel="noopener" className={`${EXTERNAL} block text-m`}>{s.display}</a>
            <div className="text-s opacity-l">{s.desc}</div>
          </div>
        ))}
      </div>

      <h2 className={CAPTION} style={{ letterSpacing: '0.08em' }}>Grundsätze</h2>
      <p className={PROSE}>
        Keine Kommentare, keine Voreingenommenheit gegenüber irgendeiner Gruppe, kein Aktivismus.
        Nur ein leichterer Zugang zu Informationen aus Quellen, die von großartigen Menschen
        öffentlich gemacht wurden.
      </p>

      <h2 id="kontakt" className={CAPTION} style={{ letterSpacing: '0.08em' }}>Kontakt</h2>
      <dl className="max-w-[65ch]">
        {CONTACTS.map((c) => (
          <div key={c.email} className="mb-s flex gap-l text-m">
            <dt className="w-[8rem] shrink-0 opacity-l">{c.label}</dt>
            <dd>
              <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
            </dd>
          </div>
        ))}
      </dl>

      <h2 className={CAPTION} style={{ letterSpacing: '0.08em' }}>Zur Person</h2>
      <p className={PROSE}>
        Aus Datenschutzgründen werden Name und Anschrift des Betreibers hier nicht veröffentlicht.
        Sollte das Projekt größere Verbreitung finden, wird dies angepasst.
      </p>
    </main>
  )
}
