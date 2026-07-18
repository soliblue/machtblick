export function hasProtocolText(xml) {
  return (xml.match(/<text>([\s\S]*?)<\/text>/)?.[1] ?? '').replace(/<!\[CDATA\[|\]\]>/g, '').trim().length > 0
}
