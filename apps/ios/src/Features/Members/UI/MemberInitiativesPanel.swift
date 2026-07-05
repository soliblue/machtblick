import SwiftUI

struct MemberInitiativesPanel: View {
    let initiatives: [MemberDetailPayload.Initiative]
    @State private var query = ""

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            searchField
            if filtered.isEmpty {
                Text(Copy.noMatchingMotions)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .padding(.vertical, ThemeTokens.Spacing.l)
            } else {
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(filtered) { initiative in
                        MemberInitiativeRow(initiative: initiative)
                    }
                }
            }
        }
    }

    private var searchField: some View {
        HStack(spacing: ThemeTokens.Spacing.s) {
            Image(systemName: "magnifyingglass").font(.system(size: ThemeTokens.Icon.s))
                .foregroundStyle(ThemeColor.secondary)
            TextField(Copy.searchMotions, text: $query)
                .font(.system(size: ThemeTokens.Text.m))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, ThemeTokens.Spacing.s)
        .padding(.vertical, ThemeTokens.Spacing.s)
        .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
    }

    private var filtered: [MemberDetailPayload.Initiative] {
        guard !query.isEmpty else { return initiatives }
        return initiatives.filter { ($0.cleanTitle ?? $0.title).localizedStandardContains(query) }
    }
}
