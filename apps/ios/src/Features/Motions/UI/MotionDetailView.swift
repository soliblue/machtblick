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
                        timeline(detail)
                        subjects(detail.antrag)
                        summary(detail.antrag)
                        signatories(detail.signatories)
                        linkedVotes(detail.linkedVotes)
                        source(detail.antrag)
                    }
                    .padding(ThemeTokens.Spacing.l)
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
        .task { await store.load(id: id, cache: cache) }
    }

    private func header(_ antrag: MotionDetailPayload.Antrag) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            proposer(antrag)
            Text(antrag.cleanTitle ?? antrag.title)
                .font(.display(ThemeTokens.Text.xxl))
                .multilineTextAlignment(.leading)
            if let clean = antrag.cleanTitle, clean != antrag.title {
                Text("\(Copy.officialTitleMotion): \(antrag.title)")
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
            HStack(spacing: ThemeTokens.Spacing.s) {
                TopicChip(text: antrag.type == "gesetzentwurf" ? Copy.billTitle : Copy.motionTitle, outlined: true)
                if let date = antrag.introducedDate {
                    Text(Formatters.shortDate(date)).kicker()
                }
                if let drucksache = antrag.drucksache {
                    Text("\(Copy.drucksacheLabel) \(drucksache)").kicker()
                }
            }
        }
    }

    @ViewBuilder private func proposer(_ antrag: MotionDetailPayload.Antrag) -> some View {
        if Bundeslaender.isLaenderInitiative(antrag.initiativeFraktion) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                Image(systemName: "building.columns").font(.system(size: ThemeTokens.Icon.xl))
                    .foregroundStyle(ThemeColor.fg)
                Text("\(Copy.laenderMotion) · \(antrag.initiativeFraktion ?? "")").kicker()
            }
        } else if let fraktion = antrag.initiativeFraktion, PartyStyle.hasPartyLine(fraktion) {
            PartyBadge(party: fraktion)
        } else if let fraktion = antrag.initiativeFraktion {
            Text(PartyStyle.label(fraktion)).kicker()
        }
    }

    @ViewBuilder private func timeline(_ detail: MotionDetailPayload) -> some View {
        let stages = MotionTimeline.stages(
            type: detail.antrag.type, beratungsstand: detail.antrag.beratungsstand,
            introducedDate: detail.antrag.introducedDate, firstVote: detail.linkedVotes.first)
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            Text(Copy.verfahren).kicker()
            MotionTimelineView(stages: stages)
            if let stamp = MotionTimeline.statusStamp(
                detail.antrag.beratungsstand, hasVote: !detail.linkedVotes.isEmpty)
            {
                StampView(label: stamp, color: stampColor(stamp))
            }
        }
    }

    private func stampColor(_ stamp: String) -> Color {
        switch stamp {
        case Copy.accepted: return ThemeColor.success
        case Copy.rejected: return ThemeColor.danger
        default: return ThemeColor.gray
        }
    }

    @ViewBuilder private func subjects(_ antrag: MotionDetailPayload.Antrag) -> some View {
        if !antrag.sachgebiet.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: ThemeTokens.Spacing.xs) {
                    ForEach(antrag.sachgebiet, id: \.self) { topic in
                        TopicChip(text: topic)
                    }
                }
            }
        }
    }

    @ViewBuilder private func summary(_ antrag: MotionDetailPayload.Antrag) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            Text(Copy.proposalSummary).kicker()
            if let simplified = antrag.summarySimplified {
                MarkdownText(markdown: simplified)
                Text(Copy.aiNotice)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            } else if let abstract = antrag.abstract {
                Text(abstract).font(.serif(ThemeTokens.Text.m))
            }
            if let detailText = antrag.summaryDetail {
                MarkdownText(markdown: detailText)
            }
        }
    }

    @ViewBuilder private func signatories(_ members: [MotionDetailPayload.Signatory]) -> some View {
        if !members.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                Text(Copy.broughtBy).kicker()
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: ThemeTokens.Spacing.s) {
                        ForEach(members) { member in
                            NavigationLink(value: AppRoute.member(member.memberId)) {
                                VStack(spacing: ThemeTokens.Spacing.xs) {
                                    MemberAvatar(
                                        name: member.displayName,
                                        url: HTTPClient.absolute(member.portraitUrl), size: 48, circle: true)
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

    @ViewBuilder private func linkedVotes(_ votes: [MotionDetailPayload.LinkedVote]) -> some View {
        if !votes.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                Text(Copy.votesSection).kicker()
                ForEach(votes) { vote in
                    MotionLinkedVoteCard(vote: vote)
                }
            }
        }
    }

    private func source(_ antrag: MotionDetailPayload.Antrag) -> some View {
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
