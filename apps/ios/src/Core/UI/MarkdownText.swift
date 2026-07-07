import SwiftUI

struct MarkdownText: View {
    let markdown: String
    var bodySize: CGFloat = ThemeTokens.Text.m

    private enum Block {
        case heading(String)
        case bullet(AttributedString)
        case paragraph(AttributedString)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
                switch block {
                case .heading(let text):
                    Text(text)
                        .font(.display(ThemeTokens.Text.l))
                        .padding(.top, ThemeTokens.Spacing.xs)
                case .bullet(let text):
                    HStack(alignment: .top, spacing: ThemeTokens.Spacing.s) {
                        Text("•").font(.serif(bodySize))
                        Text(text).font(.serif(bodySize))
                    }
                case .paragraph(let text):
                    Text(text).font(.serif(bodySize))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var blocks: [Block] {
        markdown.split(separator: "\n", omittingEmptySubsequences: true).map { rawLine -> Block in
            let line = rawLine.trimmingCharacters(in: .whitespaces)
            if line.hasPrefix("#") {
                return .heading(line.drop(while: { $0 == "#" }).trimmingCharacters(in: .whitespaces))
            }
            if line.hasPrefix("* ") || line.hasPrefix("- ") {
                return .bullet(inline(String(line.dropFirst(2))))
            }
            return .paragraph(inline(line))
        }
    }

    private func inline(_ text: String) -> AttributedString {
        var attr = (try? AttributedString(markdown: text)) ?? AttributedString(text)
        for run in attr.runs {
            let intent = run.inlinePresentationIntent ?? []
            attr[run.range].font = .serif(
                bodySize,
                bold: intent.contains(.stronglyEmphasized),
                italic: intent.contains(.emphasized))
            attr[run.range].inlinePresentationIntent = nil
        }
        return attr
    }
}
