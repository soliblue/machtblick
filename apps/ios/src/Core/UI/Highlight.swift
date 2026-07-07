import SwiftUI

func highlighted(
    _ text: String, terms: [String],
    color: Color = ThemeColor.yellow.opacity(ThemeTokens.Opacity.m)
) -> AttributedString {
    let active = terms.filter { !$0.isEmpty }
    guard !active.isEmpty else { return AttributedString(text) }
    var result = AttributedString()
    var cursor = text.startIndex
    while cursor < text.endIndex {
        let match = active
            .compactMap { text.range(of: $0, options: .caseInsensitive, range: cursor..<text.endIndex) }
            .min { $0.lowerBound < $1.lowerBound }
        guard let range = match else {
            result += AttributedString(String(text[cursor...]))
            break
        }
        result += AttributedString(String(text[cursor..<range.lowerBound]))
        var segment = AttributedString(String(text[range]))
        segment.backgroundColor = color
        segment.inlinePresentationIntent = .stronglyEmphasized
        result += segment
        cursor = range.upperBound
    }
    return result
}
