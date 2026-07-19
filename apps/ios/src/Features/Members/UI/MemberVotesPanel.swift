import SwiftUI

struct MemberVotesPanel: View {
    let history: [MemberDetailPayload.HistoryEntry]
    @State private var query = ""

    var body: some View {
        let entries = filtered
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            SearchField(placeholder: Copy.searchVotes, text: $query)
            if entries.isEmpty {
                Text(Copy.noResults)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .padding(.vertical, ThemeTokens.Spacing.l)
            } else {
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(entries) { entry in
                        MemberVoteCard(entry: entry)
                            .overlay(alignment: .bottom) {
                                if entry.id != entries.last?.id {
                                    Rectangle()
                                        .fill(ThemeColor.elevated)
                                        .frame(height: ThemeTokens.Stroke.s)
                                        .padding(.horizontal, ThemeTokens.Spacing.l)
                                }
                            }
                    }
                }
            }
        }
    }

    private var filtered: [MemberDetailPayload.HistoryEntry] {
        let search = query.trimmingCharacters(in: .whitespacesAndNewlines)
        return history.filter { entry in
            search.isEmpty
                || entry.cleanTitle.range(
                    of: search, options: [.caseInsensitive, .diacriticInsensitive],
                    locale: AppLocale.current.locale) != nil
                || entry.title.range(
                    of: search, options: [.caseInsensitive, .diacriticInsensitive],
                    locale: AppLocale.current.locale) != nil
        }
    }
}
