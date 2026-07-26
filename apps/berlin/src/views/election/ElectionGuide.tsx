import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { ElectionGuideData } from '@/server/election'
import { SourceList } from '../sources/SourceList'

type Props = {
  data: ElectionGuideData
}

export function ElectionGuide({ data }: Props) {
  return (
    <main className="mx-auto min-h-[calc(100svh-110px)] max-w-3xl px-l py-xl">
      <header className="max-w-[640px]">
        <div className="text-s caption opacity-l">Abgeordnetenhauswahl am 20. September 2026</div>
        <h1 className="mt-xs font-display text-xxl font-semibold">Zwei Kreuze, zwei Entscheidungen</h1>
        <p className="mt-s font-prose text-l">
          Du wählst eine Person aus deinem Wahlkreis und eine Parteiliste. Beide Stimmen stehen erstmals gemeinsam auf einem Stimmzettel.
        </p>
      </header>
      <section className="mt-xl grid gap-m desk:grid-cols-2">
        <article className="rounded-m border border-fg/15 p-l">
          <div className="font-display text-[40px] font-semibold tabular-nums text-purple">01</div>
          <div className="mt-m text-s caption opacity-l">Erststimme</div>
          <h2 className="mt-xs font-display text-xl font-semibold">Eine Person</h2>
          <p className="mt-s font-prose text-l">
            Du wählst eine kandidierende Person in deinem Wahlkreis. Wer dort die meisten Erststimmen erhält, gewinnt das Direktmandat.
          </p>
          <Link to="/" className="mt-m inline-flex items-center gap-xs text-m font-semibold">
            Kandidierende finden <ArrowRight size={14} />
          </Link>
        </article>
        <article className="rounded-m border border-fg/15 p-l">
          <div className="font-display text-[40px] font-semibold tabular-nums text-blue">02</div>
          <div className="mt-m text-s caption opacity-l">Zweitstimme</div>
          <h2 className="mt-xs font-display text-xl font-semibold">Eine Parteiliste</h2>
          <p className="mt-s font-prose text-l">
            Du wählst die Bezirksliste oder Landesliste einer Partei. Ihr Zweitstimmenanteil bestimmt, wie viele Sitze sie insgesamt erhält.
          </p>
          <Link to="/compare/" search={{ topic: undefined }} className="mt-m inline-flex items-center gap-xs text-m font-semibold">
            Programme vergleichen <ArrowRight size={14} />
          </Link>
        </article>
      </section>
      <section className="mt-xl rounded-m bg-surface p-l">
        <h2 className="font-display text-xl font-semibold">Stimmen dürfen getrennt werden</h2>
        <p className="mt-s font-prose text-l">
          Die Person deiner Erststimme muss nicht zu der Partei deiner Zweitstimme gehören. Das Abgeordnetenhaus hat mindestens 130 Sitze. 78 werden direkt in den Wahlkreisen vergeben, die übrigen über Listen. Eine Partei wird bei der Sitzverteilung berücksichtigt, wenn sie berlinweit mindestens fünf Prozent der Zweitstimmen oder mindestens ein Direktmandat erreicht.
        </p>
      </section>
      <section className="mt-xl border-t border-fg/15 pt-xl">
        <div className="text-s caption opacity-l">Wahlberechtigung</div>
        <h2 className="mt-xs font-display text-xl font-semibold">Wer darf das Abgeordnetenhaus wählen?</h2>
        <ul className="mt-m grid gap-s text-m">
          <li className="rounded-m bg-surface px-m py-s">Deutsche Staatsangehörigkeit</li>
          <li className="rounded-m bg-surface px-m py-s">Am Wahltag mindestens 16 Jahre alt</li>
          <li className="rounded-m bg-surface px-m py-s">Seit mindestens drei Monaten ohne Unterbrechung in Berlin wohnhaft oder überwiegend aufhältig</li>
          <li className="rounded-m bg-surface px-m py-s">Wahlrecht nicht durch eine Gerichtsentscheidung verloren</li>
        </ul>
      </section>
      <section className="mt-xl border-t border-fg/15 pt-xl">
        <div className="text-s caption opacity-l">Was Machtblick abdeckt</div>
        <h2 className="mt-xs font-display text-xl font-semibold">Quellen statt Selbstauskunft ohne Kontext</h2>
        <p className="mt-s font-prose text-l">
          Wir führen Person, Kandidaturen, persönliche Angaben und Parteiprogramm getrennt. Parteipositionen werden keiner Person zugeschrieben. Fehlende Angaben bleiben sichtbar fehlend.
        </p>
        <dl className="mt-l grid gap-s text-m">
          <div className="flex justify-between gap-l border-t border-fg/15 pt-s"><dt className="opacity-l">Zugelassene Parteien</dt><dd>{data.partyCount}</dd></div>
          <div className="flex justify-between gap-l border-t border-fg/15 pt-s"><dt className="opacity-l">Parteien mit erfassten Namen</dt><dd>{data.partyCandidateCount}</dd></div>
          <div className="flex justify-between gap-l border-t border-fg/15 pt-s"><dt className="opacity-l">Erfasste Personen</dt><dd>{data.candidateCount}</dd></div>
          <div className="flex justify-between gap-l border-t border-fg/15 pt-s"><dt className="opacity-l">Kandidaturen</dt><dd>{data.candidacyCount}</dd></div>
          <div className="flex justify-between gap-l border-t border-fg/15 pt-s"><dt className="opacity-l">Biografische Kurzprofile</dt><dd>{data.biographyCount}</dd></div>
          <div className="flex justify-between gap-l border-t border-fg/15 pt-s"><dt className="opacity-l">Profile mit persönlichen Schwerpunkten</dt><dd>{data.priorityCount}</dd></div>
          <div className="flex justify-between gap-l border-t border-fg/15 pt-s"><dt className="opacity-l">Parteien mit Programmmaterial</dt><dd>{data.programmeCount}</dd></div>
          <div className="flex justify-between gap-l border-t border-fg/15 pt-s"><dt className="opacity-l">Aktuelle Wahlprogramme 2026</dt><dd>{data.currentProgrammeCount}</dd></div>
          <div className="flex justify-between gap-l border-t border-fg/15 pt-s"><dt className="opacity-l">Aufbereitete Themen</dt><dd>{data.topicCount}</dd></div>
          <div className="flex justify-between gap-l border-t border-fg/15 pt-s"><dt className="opacity-l">Originaldokumente</dt><dd>{data.documentCount}</dd></div>
        </dl>
      </section>
      <div className="mt-xl">
        <SourceList
          label="Amtliche Regeln und Datenstand"
          sources={[
            {
              id: 'wahl-erklaert',
              kind: 'election_information',
              url: 'https://www.berlin.de/politische-bildung/berlinwahlen-2026/abgeordnetenhauswahl/artikel.1664704.php',
              title: 'Abgeordnetenhauswahl 2026 erklärt',
              publisher: 'Berliner Landeszentrale für politische Bildung',
              publicationDate: null,
              retrievedAt: '2026-07-25'
            },
            {
              id: 'wahl-faq',
              kind: 'election_information',
              url: 'https://www.berlin.de/wahlen/wahlen/berliner-wahlen-2026/fragen-und-antwortkatalog/artikel.1646712.php',
              title: 'Frage- und Antwortkatalog zur Berlin-Wahl 2026',
              publisher: 'Der Landeswahlleiter für Berlin',
              publicationDate: '2026-03-11',
              retrievedAt: '2026-07-25'
            }
          ]}
        />
      </div>
    </main>
  )
}
