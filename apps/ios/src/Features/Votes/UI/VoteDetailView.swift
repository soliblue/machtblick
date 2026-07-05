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
                    .padding(ThemeTokens.Spacing.l)
                }
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
            if let topic = detail.vote.topic {
                Text(topic)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
            }
            if detail.vote.inverted { noticeBox(Copy.invertedNotice) }
            if detail.vote.isPetitionBundle { noticeBox(Copy.petitionNotice) }
            if let simplified = detail.vote.summarySimplified {
                MarkdownText(markdown: simplified)
                    .padding(.top, ThemeTokens.Spacing.xs)
            }
            if let antraege = detail.antraege, !antraege.isEmpty {
                motions(antraege)
            }
        }
    }

    private func motions(_ antraege: [VoteDetailPayload.Antrag]) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            Text(Copy.relatedMotions).kicker()
            ForEach(antraege) { antrag in
                NavigationLink(value: AppRoute.motion(antrag.antragId)) {
                    HStack(spacing: ThemeTokens.Spacing.s) {
                        Image(systemName: "doc.text").font(.system(size: ThemeTokens.Icon.s))
                        Text(antrag.type == "gesetzentwurf" ? Copy.billTitle : Copy.motionTitle)
                            .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                        if let drucksache = antrag.drucksache {
                            Text("\(Copy.drucksacheLabel) \(drucksache)")
                                .font(.system(size: ThemeTokens.Text.s))
                                .foregroundStyle(ThemeColor.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").font(.system(size: ThemeTokens.Text.s))
                            .foregroundStyle(ThemeColor.secondary)
                    }
                    .foregroundStyle(ThemeColor.fg)
                    .padding(ThemeTokens.Spacing.m)
                    .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func ergebnis(_ detail: VoteDetailPayload) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
            if let url = HTTPClient.absolute(detail.vote.sourceUrl) {
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                    Text(Copy.officialDataNotice)
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                    Link("\(Copy.officialDataLink) ↗", destination: url)
                        .font(.system(size: ThemeTokens.Text.s))
                }
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
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                Text(Copy.aiSummaryNotice)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
                if let pdf = detail.antragPdfUrl, let url = HTTPClient.absolute(pdf) {
                    Link(Copy.fullMotion, destination: url)
                        .font(.system(size: ThemeTokens.Text.s))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(ThemeTokens.Spacing.m)
            .background(ThemeColor.surface)
            if let detailText = detail.vote.summaryDetail {
                MarkdownText(markdown: detailText)
            }
        }
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
