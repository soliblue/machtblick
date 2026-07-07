import SwiftUI

struct MemberInitiativesPanel: View {
    let initiatives: [MemberDetailPayload.Initiative]
    @State private var query = ""

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            SearchField(placeholder: Copy.searchMotions, text: $query)
            if filtered.isEmpty {
                Text(Copy.noMatchingMotions)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .padding(.vertical, ThemeTokens.Spacing.l)
            } else {
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(filtered.enumerated()), id: \.element.id) { index, initiative in
                        MemberInitiativeRow(initiative: initiative, showDivider: index > 0)
                    }
                }
            }
        }
    }

    private var filtered: [MemberDetailPayload.Initiative] {
        guard !query.isEmpty else { return initiatives }
        return initiatives.filter { ($0.cleanTitle ?? $0.title).localizedStandardContains(query) }
    }
}
