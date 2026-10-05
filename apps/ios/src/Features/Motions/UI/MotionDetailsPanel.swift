import SwiftUI

struct MotionDetailsPanel: View {
    let antrag: MotionDetailPayload.Antrag
    let stages: [MotionStage]

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
            if antrag.summarySimplified != nil {
                Text(Copy.aiNotice)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(ThemeTokens.Spacing.m)
                    .background(ThemeColor.surface, in: RoundedRectangle(cornerRadius: ThemeTokens.Radius.m))
            }
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                Text(Copy.verfahren).kicker()
                MotionTimelineView(stages: stages)
            }
            if !antrag.sachgebiet.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: ThemeTokens.Spacing.xs) {
                        ForEach(antrag.sachgebiet, id: \.self) { topic in
                            TopicChip(text: topic)
                        }
                    }
                }
                .edgeToEdgeScroll()
            }
            if let detailText = antrag.summaryDetail {
                MarkdownText(markdown: detailText, bodySize: ThemeTokens.Text.l)
            }
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                if let pdf = antrag.drucksachePdfUrl, let url = HTTPClient.absolute(pdf) {
                    Link(Copy.motionPdf, destination: url)
                }
                Link(Copy.dipSource, destination: URL(string: "https://dip.bundestag.de")!)
            }
            .font(.system(size: ThemeTokens.Text.s))
            .foregroundStyle(ThemeColor.secondary)
        }
    }
}
