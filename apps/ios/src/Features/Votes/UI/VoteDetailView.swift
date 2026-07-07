import SwiftUI

private enum VoteTab: Hashable {
    case ergebnis
    case details
    case reden
}

struct VoteDetailView: View {
    let id: String
    let cache: ApiCache
    @State private var store = VoteDetailStore()
    @State private var tab: VoteTab = .ergebnis
    @State private var selected: VoteChoice?

    var body: some View {
        Group {
            if let detail = store.detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
                        header(detail)
                        picker(detail)
                        panel(detail)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(ThemeTokens.Spacing.l)
                }
                .scrollDismissesKeyboard(.interactively)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        ShareLinkButton(title: detail.vote.cleanTitle, url: HTTPClient.page("/votes/\(id)"))
                    }
                }
            } else if store.loadFailed {
                ErrorStateView(message: Copy.loadError) { Task { await store.load(id: id, cache: cache) } }
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(ThemeColor.background)
        .navigationBarTitleDisplayMode(.inline)
        .sensoryFeedback(.selection, trigger: tab)
        .sensoryFeedback(.selection, trigger: selected)
        .task { await store.load(id: id, cache: cache) }
    }

    private func tabs(_ detail: VoteDetailPayload) -> [VoteTab] {
        var result: [VoteTab] = [.ergebnis]
        if detail.vote.summaryDetail != nil { result.append(.details) }
        if !detail.debate.isEmpty { result.append(.reden) }
        return result
    }

    private func tabLabel(_ tab: VoteTab) -> String {
        switch tab {
        case .ergebnis: return Copy.tabResult
        case .details: return Copy.tabDetails
        case .reden: return Copy.tabSpeeches
        }
    }

    @ViewBuilder private func picker(_ detail: VoteDetailPayload) -> some View {
        let available = tabs(detail)
        if available.count > 1 {
            Picker("", selection: $tab) {
                ForEach(available, id: \.self) { Text(tabLabel($0)).tag($0) }
            }
            .pickerStyle(.segmented)
        }
    }

    @ViewBuilder private func panel(_ detail: VoteDetailPayload) -> some View {
        let active = tabs(detail).contains(tab) ? tab : .ergebnis
        switch active {
        case .ergebnis: ergebnis(detail)
        case .details: details(detail)
        case .reden:
            DebatePanel(
                speeches: VoteDebateAdapter.speeches(detail),
                partySummaries: VoteDebateAdapter.partySummaries(detail))
        }
    }

    private func header(_ detail: VoteDetailPayload) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            if detail.vote.inverted { noticeBox(Copy.invertedNotice) }
            if detail.vote.isPetitionBundle { noticeBox(Copy.petitionNotice) }
            HStack(spacing: ThemeTokens.Spacing.s) {
                ProposerKicker(party: detail.proposingParty ?? Copy.unknown)
                    .frame(maxWidth: .infinity, alignment: .leading)
                StampView(label: detail.vote.result.label, color: detail.vote.result.color)
                Text(Formatters.shortDate(detail.vote.date))
                    .kicker()
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
            Text(detail.vote.cleanTitle)
                .font(.display(ThemeTokens.Text.xl))
                .multilineTextAlignment(.leading)
            if !detail.vote.cleanTitle.isEmpty && detail.vote.cleanTitle != detail.vote.title {
                Text("\(Copy.officialTitle): \(detail.vote.title)")
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
            AntragSignatoryStrip(signatories: store.signatories)
            if let simplified = detail.vote.summarySimplified {
                MarkdownText(markdown: simplified, bodySize: ThemeTokens.Text.l)
                    .padding(.top, ThemeTokens.Spacing.xs)
            }
        }
    }

    private func ergebnis(_ detail: VoteDetailPayload) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
            if let url = HTTPClient.absolute(detail.vote.sourceUrl) {
                Text("\(Copy.officialDataNotice) [\(Copy.officialDataLink) ↗](\(url.absoluteString))")
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
                    .tint(ThemeColor.fg)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(ThemeTokens.Spacing.m)
                    .background(ThemeColor.surface)
            }
            VoteHemicycleView(
                yes: detail.vote.yes, no: detail.vote.no, abstain: detail.vote.abstain,
                absent: detail.vote.absent, total: max(detail.vote.totalMembers, 1), hero: true,
                selected: selected,
                onSelect: { choice in selected = selected == choice ? nil : choice }
            )
            .frame(maxWidth: 440)
            .frame(maxWidth: .infinity)
            VoteDonutGrid(summaries: detail.partySummaries.map(\.counts), selected: selected)
            DefectorsSection(defectors: detail.defectors)
        }
    }

    private func details(_ detail: VoteDetailPayload) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
            summaryNotice(detail)
                .font(.system(size: ThemeTokens.Text.s))
                .foregroundStyle(ThemeColor.secondary)
                .tint(ThemeColor.fg)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(ThemeTokens.Spacing.m)
                .background(ThemeColor.surface)
            if let detailText = detail.vote.summaryDetail {
                MarkdownText(markdown: detailText, bodySize: ThemeTokens.Text.l)
            }
        }
    }

    private func summaryNotice(_ detail: VoteDetailPayload) -> Text {
        if let pdf = detail.antragPdfUrl, let url = HTTPClient.absolute(pdf) {
            return Text("\(Copy.aiSummaryNotice) [\(Copy.fullMotion)](\(url.absoluteString))")
        }
        return Text(Copy.aiSummaryNotice)
    }

    private func noticeBox(_ text: String) -> some View {
        Text(text)
            .font(.system(size: ThemeTokens.Text.s))
            .foregroundStyle(ThemeColor.fg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(ThemeTokens.Spacing.m)
            .background(ThemeColor.surface)
    }
}
