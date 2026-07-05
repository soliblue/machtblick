import SwiftUI

struct VoteDocumentsSection: View {
    let documents: [VoteDetailPayload.Document]
    let antragPdfUrl: String?
    let sourceUrl: String

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            Text(Copy.documentsSection).kicker()
            ForEach(documents) { document in
                if let url = HTTPClient.absolute(document.url) {
                    Link(destination: url) {
                        HStack(spacing: ThemeTokens.Spacing.s) {
                            Image(systemName: "doc")
                                .font(.system(size: ThemeTokens.Icon.s))
                            Text("\(document.label) · \(document.title)")
                                .font(.system(size: ThemeTokens.Text.s))
                                .lineLimit(2)
                                .multilineTextAlignment(.leading)
                            Spacer()
                        }
                    }
                    .foregroundStyle(ThemeColor.secondary)
                }
            }
            if let pdf = antragPdfUrl, let url = HTTPClient.absolute(pdf) {
                Link(Copy.motionPdf, destination: url)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
            if let url = HTTPClient.absolute(sourceUrl) {
                Link(Copy.sourceLink, destination: url)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
        }
    }
}
