import SwiftUI

private enum MemberTab: Hashable {
    case votes
    case speeches
    case motions
}

struct MemberDetailView: View {
    let id: String
    let cache: ApiCache
    @State private var store = MemberDetailStore()
    @State private var tab: MemberTab = .votes

    var body: some View {
        Group {
            if let detail = store.detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
                        header(detail)
                        stats(detail)
                        picker(detail)
                        panel(detail)
                    }
                    .padding(ThemeTokens.Spacing.l)
                }
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        ShareLinkButton(title: detail.name, url: HTTPClient.page("/members/\(id)"))
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
        .task { await store.load(id: id, cache: cache) }
    }

    private func header(_ detail: MemberDetailPayload) -> some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.l) {
            VStack(spacing: ThemeTokens.Spacing.xs) {
                MemberAvatar(
                    name: detail.name, url: HTTPClient.absolute(detail.pictureUrl), size: 112, circle: true)
                if let credit = credit(detail) {
                    Text(credit)
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                        .lineLimit(1)
                        .frame(width: 112)
                }
            }
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                Text(detail.name)
                    .font(.display(ThemeTokens.Text.xxl))
                    .multilineTextAlignment(.leading)
                Text(meta(detail)).kicker()
            }
        }
    }

    private func credit(_ detail: MemberDetailPayload) -> String? {
        guard detail.pictureUrl != nil, let author = detail.pictureAuthor, let license = detail.pictureLicense
        else { return nil }
        return "\(Copy.photoLabel): \(author), \(license)"
    }

    private func meta(_ detail: MemberDetailPayload) -> String {
        var parts = [PartyStyle.label(detail.party)]
        if !detail.state.isEmpty { parts.append(detail.state) }
        if let mandate = detail.mandateType { parts.append(MemberLabels.mandate(mandate)) }
        if detail.mandateType == "direkt", let name = detail.constituencyName {
            parts.append("\(Copy.constituency) \(name)")
        }
        if let year = detail.yearOfBirth {
            parts.append("\(Calendar.current.component(.year, from: Date()) - year) \(Copy.years)")
        }
        if let education = detail.education { parts.append(education) }
        return parts.joined(separator: " · ")
    }

    private func stats(_ detail: MemberDetailPayload) -> some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.l) {
            PosterStatBar(
                label: Copy.attendance, value: detail.attendance,
                sub: (text: "\(missed(detail)) \(Copy.vonWord) \(detail.history.count) \(Copy.missed)", danger: false)
            )
            .frame(maxWidth: .infinity, alignment: .leading)
            loyalty(detail)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder private func loyalty(_ detail: MemberDetailPayload) -> some View {
        if let value = detail.loyalty {
            PosterStatBar(
                label: Copy.loyalty, value: value,
                sub: (
                    text: "\(detail.defections) \(Copy.defections)", danger: detail.defections > 0
                ))
        } else {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                Text(Copy.loyalty).kicker()
                Text(PartyStyle.hasPartyLine(detail.party) ? Copy.noVoteData : Copy.noPartyLine)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
        }
    }

    private func missed(_ detail: MemberDetailPayload) -> Int {
        detail.history.filter { $0.choice == .nichtAbgegeben }.count
    }

    private func tabs(_ detail: MemberDetailPayload) -> [MemberTab] {
        var result: [MemberTab] = []
        if !detail.history.isEmpty { result.append(.votes) }
        if !detail.speeches.isEmpty { result.append(.speeches) }
        if let initiatives = detail.initiatives, !initiatives.isEmpty { result.append(.motions) }
        return result
    }

    private func tabLabel(_ tab: MemberTab) -> String {
        switch tab {
        case .votes: return Copy.votesSection
        case .speeches: return Copy.speechesSection
        case .motions: return Copy.tabMotions
        }
    }

    @ViewBuilder private func picker(_ detail: MemberDetailPayload) -> some View {
        let available = tabs(detail)
        if available.count > 1 {
            Picker("", selection: $tab) {
                ForEach(available, id: \.self) { Text(tabLabel($0)).tag($0) }
            }
            .pickerStyle(.segmented)
        }
    }

    @ViewBuilder private func panel(_ detail: MemberDetailPayload) -> some View {
        let active = tabs(detail).contains(tab) ? tab : (tabs(detail).first ?? .votes)
        switch active {
        case .votes: MemberVotesPanel(history: detail.history)
        case .speeches: MemberSpeechesPanel(speeches: detail.speeches)
        case .motions: MemberInitiativesPanel(initiatives: detail.initiatives ?? [])
        }
    }
}
