import Foundation

func matchSnippet(_ text: String, terms: [String], context: Int = 100) -> String {
    let active = terms.filter { !$0.isEmpty }
    guard !active.isEmpty else { return text }
    let first = active
        .compactMap { text.range(of: $0, options: .caseInsensitive) }
        .min { $0.lowerBound < $1.lowerBound }
    guard let match = first else { return text }
    let lower = text.distance(from: text.startIndex, to: match.lowerBound)
    let upper = text.distance(from: text.startIndex, to: match.upperBound)
    let startOffset = max(0, lower - context)
    let endOffset = min(text.count, upper + context)
    let start = text.index(text.startIndex, offsetBy: startOffset)
    let end = text.index(text.startIndex, offsetBy: endOffset)
    var snippet = String(text[start..<end])
    if startOffset > 0 { snippet = "… " + snippet }
    if endOffset < text.count { snippet += " …" }
    return snippet
}
