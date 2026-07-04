export type Source = { name: string; url: string; display: string; desc: string }

const URLS = {
  stammdaten: 'https://www.bundestag.de/services/opendata',
  protokolle: 'https://dserver.bundestag.de/',
  parlamentaria: 'https://www.bundestag.de/parlament/praesidium/parteienfinanzierung',
  dip: 'https://search.dip.bundestag.de/',
  wikidata: 'https://query.wikidata.org/',
  commons: 'https://commons.wikimedia.org/',
}

export const COPY = {
  de: {
    title: 'Impressum',
    whatHeading: 'Was ist Machtblick',
    whatBody:
      'Machtblick ist das Projekt eines einzelnen deutschen Bürgers, der mit Hilfe von KI Werkzeuge baut, die die Arbeit des Bundestages und der Regierung zugänglicher machen. Keine Kommentare, keine politische Position, kein Aktivismus. Es geht darum, öffentliche Quellen in eine Oberfläche zu übersetzen, die für die Allgemeinheit nutzbar ist.',
    sourcesHeading: 'Datenquellen',
    bundestagHeading: 'Deutscher Bundestag',
    sourcesBundestag: [
      { name: 'Stammdaten', url: URLS.stammdaten, display: 'bundestag.de', desc: 'Stammdaten der Abgeordneten' },
      { name: 'Plenarprotokolle', url: URLS.protokolle, display: 'dserver.bundestag.de', desc: 'Reden und Protokolle der Plenarsitzungen' },
      { name: 'Parlamentaria', url: URLS.parlamentaria, display: 'bundestag.de', desc: 'Parteispenden über 50.000 Euro' },
      { name: 'DIP', url: URLS.dip, display: 'search.dip.bundestag.de', desc: 'Anträge und Drucksachen' },
    ] as Source[],
    licenseNote: 'Quellen ohne explizite Lizenzangabe sind öffentlich zugängliche Daten des Deutschen Bundestages.',
    abgeordnetenwatchDesc: 'Profile, Fraktionswechsel, Porträtverweise',
    imagesHeading: 'Bilder',
    sourcesImages: [
      { name: 'Wikidata', url: URLS.wikidata, display: 'query.wikidata.org', desc: 'Porträtverweise (P18), CC0' },
      { name: 'Wikimedia Commons', url: URLS.commons, display: 'commons.wikimedia.org', desc: 'Porträtdateien, Lizenzen je Datei mitgespeichert' },
    ] as Source[],
    principlesHeading: 'Grundsätze',
    principlesBody:
      'Keine Kommentare, keine Voreingenommenheit gegenüber irgendeiner Gruppe, kein Aktivismus. Nur ein leichterer Zugang zu Informationen aus Quellen, die von großartigen Menschen öffentlich gemacht wurden.',
    contactHeading: 'Kontakt',
    contacts: [
      { label: 'Fragen', email: 'hello@machtblick.de' },
      { label: 'Feedback', email: 'feedback@machtblick.de' },
      { label: 'Mitmachen', email: 'mitmachen@machtblick.de' },
    ],
    operatorHeading: 'Zur Person',
    operatorBody:
      'Aus Datenschutzgründen werden Name und Anschrift des Betreibers hier nicht veröffentlicht. Sollte das Projekt größere Verbreitung finden, wird dies angepasst.',
  },
  en: {
    title: 'Imprint',
    whatHeading: 'What Machtblick is',
    whatBody:
      'Machtblick is the project of one German citizen building AI-assisted tools that make the work of the Bundestag and the Federal Government easier to access. No commentary, no political position, no activism. The aim is to translate public sources into an interface that the public can actually use.',
    sourcesHeading: 'Data sources',
    bundestagHeading: 'German Bundestag',
    sourcesBundestag: [
      { name: 'Master data', url: URLS.stammdaten, display: 'bundestag.de', desc: 'Member master data' },
      { name: 'Plenary records', url: URLS.protokolle, display: 'dserver.bundestag.de', desc: 'Speeches and plenary records' },
      { name: 'Parlamentaria', url: URLS.parlamentaria, display: 'bundestag.de', desc: 'Party donations above 50,000 euros' },
      { name: 'DIP', url: URLS.dip, display: 'search.dip.bundestag.de', desc: 'Motions and parliamentary papers' },
    ] as Source[],
    licenseNote: 'Sources without an explicit license notice are publicly available data from the German Bundestag.',
    abgeordnetenwatchDesc: 'Profiles, party changes, portrait references',
    imagesHeading: 'Images',
    sourcesImages: [
      { name: 'Wikidata', url: URLS.wikidata, display: 'query.wikidata.org', desc: 'Portrait references (P18), CC0' },
      { name: 'Wikimedia Commons', url: URLS.commons, display: 'commons.wikimedia.org', desc: 'Portrait files, licenses stored per file' },
    ] as Source[],
    principlesHeading: 'Principles',
    principlesBody:
      'No commentary, no bias against any group, no activism. Just easier access to information from sources made public by people doing valuable work.',
    contactHeading: 'Contact',
    contacts: [
      { label: 'Questions', email: 'hello@machtblick.de' },
      { label: 'Feedback', email: 'feedback@machtblick.de' },
      { label: 'Contribute', email: 'mitmachen@machtblick.de' },
    ],
    operatorHeading: 'About the operator',
    operatorBody:
      'For privacy reasons, the name and address of the operator are not published here. If the project gains wider distribution, this will be adjusted.',
  },
}
