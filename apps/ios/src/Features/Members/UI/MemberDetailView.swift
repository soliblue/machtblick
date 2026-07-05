import SwiftUI

struct MemberDetailView: View {
    let id: String
    let cache: ApiCache
    @State private var store = MemberDetailStore()
    @State private var section = 0

    var body: some View {
        Group {
            if let detail = store.detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
                        header(detail)
                        VStack(spacing: ThemeTokens.Spacing.m) {
                            StatBar(label: Copy.attendance, value: detail.attendance)
                            if let loyalty = detail.loyalty {
                                StatBar(label: Copy.loyalty, value: loyalty)
                            }
                        }
                        Picker("", selection: $section) {
                            Text("\(Copy.votesSection) (\(detail.history.count))").tag(0)
                            Text("\(Copy.speechesSection) (\(detail.speeches.count))").tag(1)
                        }
                        .pickerStyle(.segmented)
                        if section == 0 {
                            LazyVStack(alignment: .leading, spacing: 0) {
                                ForEach(detail.history) { entry in
                                    MemberVoteRow(entry: entry)
                                }
                            }
                        } else {
                            LazyVStack(alignment: .leading, spacing: 0) {
                                ForEach(detail.speeches) { speech in
                                    MemberSpeechRow(speech: speech)
                                }
                            }
                        }
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

    private func header(_ detail: MemberDetailPayload) -> some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.l) {
            MemberAvatar(name: detail.name, url: HTTPClient.absolute(detail.pictureUrl), size: 112)
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                Text(detail.name)
                    .font(.display(ThemeTokens.Text.xxl))
                    .multilineTextAlignment(.leading)
                Text(meta(detail)).kicker()
            }
        }
    }

    private func meta(_ detail: MemberDetailPayload) -> String {
        var parts = [PartyStyle.label(detail.party)]
        if !detail.state.isEmpty { parts.append(detail.state) }
        if detail.mandateType == "direkt" {
            parts.append(detail.constituencyName.map { "\(Copy.constituency) \($0)" } ?? Copy.direct)
        }
        if detail.mandateType == "liste" { parts.append(Copy.list) }
        if let year = detail.yearOfBirth { parts.append("\(Copy.born) \(year)") }
        return parts.joined(separator: " · ")
    }
}
