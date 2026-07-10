export const GROUPS = {
  EPP: { slug: 'evp', name: 'Europäische Volkspartei', shortName: 'EVP', color: '#3b6ea5' },
  SD: { slug: 'sd', name: 'Progressive Allianz der Sozialdemokraten', shortName: 'S&D', color: '#c0392b' },
  RENEW: { slug: 'renew', name: 'Renew Europe', shortName: 'Renew', color: '#c9a227' },
  GREEN_EFA: { slug: 'gruene-efa', name: 'Die Grünen/Europäische Freie Allianz', shortName: 'Grüne/EFA', color: '#4c9a4c' },
  GUE_NGL: { slug: 'linke', name: 'Die Linke im Europäischen Parlament', shortName: 'Linke', color: '#8b1e2d' },
  ECR: { slug: 'ekr', name: 'Europäische Konservative und Reformer', shortName: 'EKR', color: '#3a7ca5' },
  PFE: { slug: 'pfe', name: 'Patrioten für Europa', shortName: 'PfE', color: '#1c3f6e' },
  ID: { slug: 'id', name: 'Identität und Demokratie', shortName: 'ID', color: '#1a3a5a' },
  ESN: { slug: 'esn', name: 'Europa der Souveränen Nationen', shortName: 'ESN', color: '#4a4a6a' },
  NI: { slug: 'ni', name: 'Fraktionslos', shortName: 'NI', color: '#7a7a7a' },
  GUE_NGL_1995_0: { slug: 'linke', name: 'Die Linke im Europäischen Parlament', shortName: 'Linke', color: '#8b1e2d' },
}

export function groupSlug(code) {
  return GROUPS[code]?.slug ?? 'ni'
}
