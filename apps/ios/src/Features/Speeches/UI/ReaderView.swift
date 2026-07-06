import SwiftUI

struct ReaderView: View {
    let item: ReaderItem
    let index: Int
    let count: Int
    let onPrev: (() -> Void)?
    let onNext: (() -> Void)?
    let onClose: () -> Void
    @State private var fullText: String?
    @State private var loadingBody = false

    var body: some View {
        VStack(spacing: 0) {
            header
            Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
            ScrollView {
                content
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(ThemeTokens.Spacing.l)
            }
            if count > 1 {
                Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
                footer
            }
        }
        .background(ThemeColor.background)
        .task(id: item.id) { await loadBody() }
    }

    private func loadBody() async {
        if case .speech(let speech) = item {
            fullText = nil
            loadingBody = true
            let body = await SpeechBodyService.shared.text(ids: [speech.id])
            fullText = body.isEmpty ? speech.excerpt : body
            loadingBody = false
        }
    }

    @ViewBuilder private var header: some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
            switch item {
            case .speech(let speech):
                SpeakerAvatar(name: speech.speakerName, pictureUrl: speech.pictureUrl, size: 36)
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                    Text(speech.speakerName)
                        .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                    HStack(spacing: ThemeTokens.Spacing.s) {
                        if let party = speech.party { PartyBadge(party: party) }
                        if let role = speech.speakerRole {
                            Text(role).font(.system(size: ThemeTokens.Text.s))
                                .foregroundStyle(ThemeColor.secondary)
                        }
                    }
                    if let date = speech.date {
                        Text(Formatters.shortDate(date))
                            .font(.system(size: ThemeTokens.Text.s))
                            .foregroundStyle(ThemeColor.secondary)
                    }
                }
                Spacer(minLength: 0)
                if let choice = speech.choice, choice != .nichtAbgegeben {
                    StampView(label: choice.label, color: choice.color)
                }
            case .summary(let summary):
                if PartyStyle.hasLogo(summary.party) {
                    PartyLogo(party: summary.party, size: ThemeTokens.Icon.l)
                } else {
                    Text(PartyStyle.label(summary.party))
                        .font(.system(size: ThemeTokens.Text.l, weight: .semibold))
                        .foregroundStyle(PartyStyle.color(summary.party))
                }
                Spacer(minLength: 0)
                StampView(label: summary.stance.label, color: summary.stance.color)
            }
            Button(action: onClose) {
                Image(systemName: "xmark").font(.system(size: ThemeTokens.Icon.l))
                    .foregroundStyle(ThemeColor.secondary)
            }
        }
        .padding(ThemeTokens.Spacing.l)
    }

    @ViewBuilder private var content: some View {
        switch item {
        case .speech(let speech):
            if loadingBody {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, ThemeTokens.Spacing.xl)
            } else {
                Text(fullText ?? speech.excerpt)
                    .font(.serif(ThemeTokens.Text.l))
                    .foregroundStyle(ThemeColor.fg)
                    .multilineTextAlignment(.leading)
            }
        case .summary(let summary):
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
                if let position = summary.positionSummary {
                    Text(position).font(.serif(ThemeTokens.Text.m))
                }
                if let points = summary.keyPoints {
                    MarkdownText(markdown: points)
                }
                if let dissent = summary.dissentNote {
                    Text(dissent).font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                }
                Text(Copy.aiNotice).font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
        }
    }

    private var footer: some View {
        HStack {
            Button(action: { onPrev?() }) {
                Image(systemName: "chevron.left").font(.system(size: ThemeTokens.Icon.m))
            }
            .disabled(onPrev == nil)
            Spacer()
            Text("\(index + 1) / \(count)")
                .font(.system(size: ThemeTokens.Text.s))
                .foregroundStyle(ThemeColor.secondary)
                .monospacedDigit()
            Spacer()
            Button(action: { onNext?() }) {
                Image(systemName: "chevron.right").font(.system(size: ThemeTokens.Icon.m))
            }
            .disabled(onNext == nil)
        }
        .foregroundStyle(ThemeColor.secondary)
        .padding(.horizontal, ThemeTokens.Spacing.l)
        .padding(.vertical, ThemeTokens.Spacing.m)
    }
}
