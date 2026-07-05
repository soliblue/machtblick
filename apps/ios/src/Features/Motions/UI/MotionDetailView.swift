import SwiftUI

struct MotionDetailView: View {
    let id: Int
    let cache: ApiCache
    @State private var store = MotionDetailStore()

    var body: some View {
        Group {
            if let detail = store.detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
                        header(detail.antrag)
                        summary(detail.antrag)
                        signatories(detail.signatories)
                        linkedVotes(detail.linkedVotes)
                        links(detail.antrag)
                    }
                    .padding(ThemeTokens.Spacing.l)
                }
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(ThemeColor.background)
        .navigationBarTitleDisplayMode(.inline)
        .task { await store.load(id: id, cache: cache) }
    }

    private func header(_ antrag: MotionDetailPayload.Antrag) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                Text(antrag.type == "gesetzentwurf" ? Copy.billTitle : Copy.motionTitle)
                    .kicker()
                if let drucksache = antrag.drucksache {
                    Text("\(Copy.drucksacheLabel) \(drucksache)").kicker()
                }
                Spacer()
                if let date = antrag.introducedDate {
                    Text(Formatters.shortDate(date)).kicker()
                }
            }
            Text(antrag.cleanTitle ?? antrag.title)
                .font(.display(ThemeTokens.Text.xxl))
                .multilineTextAlignment(.leading)
            if let stand = antrag.beratungsstand {
                Text("\(Copy.statusLabel): \(stand)")
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
        }
    }

    @ViewBuilder
    private func summary(_ antrag: MotionDetailPayload.Antrag) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            if let abstract = antrag.abstract {
                Text(abstract).font(.serif(ThemeTokens.Text.m))
            }
            if let simplified = antrag.summarySimplified {
                MarkdownText(markdown: simplified)
            }
            if let detailText = antrag.summaryDetail {
                MarkdownText(markdown: detailText)
            }
            if antrag.summarySimplified != nil || antrag.summaryDetail != nil {
                Text(Copy.aiNotice)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
        }
    }

    @ViewBuilder
    private func signatories(_ members: [MotionDetailPayload.Signatory]) -> some View {
        if !members.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                Text(Copy.signatoriesSection).kicker()
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: ThemeTokens.Spacing.s) {
                        ForEach(members) { member in
                            NavigationLink(value: AppRoute.member(member.memberId)) {
                                VStack(spacing: ThemeTokens.Spacing.xs) {
                                    MemberAvatar(
                                        name: member.displayName,
                                        url: HTTPClient.absolute(member.portraitUrl), size: 48)
                                    Text(member.displayName)
                                        .font(.system(size: 9))
                                        .foregroundStyle(ThemeColor.secondary)
                                        .lineLimit(1)
                                }
                                .frame(width: 72)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func linkedVotes(_ votes: [MotionDetailPayload.LinkedVote]) -> some View {
        if !votes.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                Text(Copy.linkedVotesSection).kicker()
                ForEach(votes) { vote in
                    NavigationLink(value: AppRoute.vote(vote.id)) {
                        HStack(spacing: ThemeTokens.Spacing.s) {
                            StampView(label: vote.result.label, color: vote.result.color)
                            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                                Text(vote.cleanTitle)
                                    .font(.system(size: ThemeTokens.Text.m))
                                    .foregroundStyle(ThemeColor.fg)
                                    .lineLimit(2)
                                    .multilineTextAlignment(.leading)
                                Text(Formatters.shortDate(vote.date)).kicker()
                            }
                            Spacer()
                        }
                        .padding(.vertical, ThemeTokens.Spacing.s)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    @ViewBuilder
    private func links(_ antrag: MotionDetailPayload.Antrag) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            if let pdf = antrag.drucksachePdfUrl, let url = HTTPClient.absolute(pdf) {
                Link(Copy.motionPdf, destination: url)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
            Text(Copy.dipSource)
                .font(.system(size: ThemeTokens.Text.s))
                .foregroundStyle(ThemeColor.secondary)
        }
    }
}
