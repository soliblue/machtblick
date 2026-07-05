export type Source = { name: string; url: string; display: string; desc: string }

const URLS = {
  opendata: 'https://www.bundestag.de/services/opendata',
  dip: 'https://dip.bundestag.de/',
  commons: 'https://commons.wikimedia.org/',
  abgeordnetenwatch: 'https://www.abgeordnetenwatch.de/',
}

export const COPY = {
  de: {
    title: 'Über die Daten',
    sourcesHeading: 'Datenquellen',
    sources: [
      { name: 'Bundestag Open Data', url: URLS.opendata, display: 'bundestag.de', desc: 'Namentliche Abstimmungen und Stammdaten der Abgeordneten (XML)' },
      { name: 'DIP', url: URLS.dip, display: 'dip.bundestag.de', desc: 'Metadaten zu Anträgen und Drucksachen über die DIP-API des Bundestages' },
      { name: 'Wikimedia Commons', url: URLS.commons, display: 'commons.wikimedia.org', desc: 'Porträts der Abgeordneten, CC-Lizenzhinweis direkt am jeweiligen Foto' },
      { name: 'abgeordnetenwatch.de', url: URLS.abgeordnetenwatch, display: 'abgeordnetenwatch.de', desc: 'Porträtverweise und Profildaten' },
    ] as Source[],
    refreshHeading: 'Aktualisierung',
    refreshBody:
      'Die Daten werden wöchentlich über eine automatisierte Pipeline aktualisiert. Jede Abstimmungs- und Antragsseite verlinkt das offizielle Quelldokument des Bundestages (Original-Drucksache als PDF).',
    aiHeading: 'KI-Hinweis',
    aiBody:
      'Zusammenfassungen und vereinfachte Titel zu Abstimmungen und Anträgen basieren auf den offiziellen Dokumenten, wurden KI-generiert und sprachlich vereinfacht. Sie können Fehler enthalten. Maßgeblich ist immer die verlinkte Original-Drucksache.',
    operatorHeading: 'Betreiber',
    operatorBefore: 'Machtblick ist ein Projekt von Ahmed Soliman. Alle Angaben zum Betreiber stehen im ',
    operatorLink: 'Impressum',
    operatorAfter: '.',
  },
  en: {
    title: 'About the data',
    sourcesHeading: 'Data sources',
    sources: [
      { name: 'Bundestag Open Data', url: URLS.opendata, display: 'bundestag.de', desc: 'Roll call votes and member master data (XML)' },
      { name: 'DIP', url: URLS.dip, display: 'dip.bundestag.de', desc: 'Motion and parliamentary paper metadata via the DIP API of the Bundestag' },
      { name: 'Wikimedia Commons', url: URLS.commons, display: 'commons.wikimedia.org', desc: 'Member portraits, CC attribution shown at each photo' },
      { name: 'abgeordnetenwatch.de', url: URLS.abgeordnetenwatch, display: 'abgeordnetenwatch.de', desc: 'Portrait references and profile data' },
    ] as Source[],
    refreshHeading: 'Updates',
    refreshBody:
      'Data is refreshed weekly through an automated pipeline. Every vote and motion page links the official Bundestag source document (original Drucksache as PDF).',
    aiHeading: 'AI notice',
    aiBody:
      'Summaries and simplified titles for votes and motions are based on the official documents. They were generated with AI and simplified linguistically. They may contain errors. The linked original Drucksache is always authoritative.',
    operatorHeading: 'Operator',
    operatorBefore: 'Machtblick is a project by Ahmed Soliman. Full operator details are in the ',
    operatorLink: 'Imprint',
    operatorAfter: '.',
  },
}
