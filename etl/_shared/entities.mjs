const NAMED = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  shy: '',
  auml: 'ä',
  ouml: 'ö',
  uuml: 'ü',
  Auml: 'Ä',
  Ouml: 'Ö',
  Uuml: 'Ü',
  szlig: 'ß',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  ccedil: 'ç',
  ndash: '\u2013',
  mdash: '\u2014',
  hellip: '…',
  sect: '§',
  para: '¶',
  euro: '€',
  bdquo: '„',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  laquo: '«',
  raquo: '»',
  deg: '°',
  middot: '·',
  bull: '•',
  times: '×',
  minus: '−',
  plusmn: '±',
  sup2: '²',
  sup3: '³',
}

export function decodeHtmlEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,30});/g, (match, body) => {
    if (body[0] !== '#') return NAMED[body] ?? match
    const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
    return Number.isNaN(code) || code > 0x10ffff ? match : code === 173 ? '' : code === 160 ? ' ' : String.fromCodePoint(code)
  })
}
