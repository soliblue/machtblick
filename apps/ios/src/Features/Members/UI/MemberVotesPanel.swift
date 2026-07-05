import SwiftUI

struct MemberVotesPanel: View {
    let history: [MemberDetailPayload.HistoryEntry]
    @State private var line: String?
    @State private var choice: BallotChoice?

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                Menu {
                    Picker(Copy.filterLine, selection: $line) {
                        Text(Copy.filterAll).tag(String?.none)
                        Text(Copy.filterLine).tag(String?("linie"))
                        Text(Copy.defections).tag(String?("abw"))
                    }
                } label: {
                    FilterPillLabel(name: Copy.filterLine, value: lineValue)
                }
                Menu {
                    Picker(Copy.filterVote, selection: $choice) {
                        Text(Copy.filterAll).tag(BallotChoice?.none)
                        Text(Copy.yes).tag(BallotChoice?(.ja))
                        Text(Copy.no).tag(BallotChoice?(.nein))
                        Text(Copy.abstain).tag(BallotChoice?(.enthalten))
                        Text(Copy.notCast).tag(BallotChoice?(.nichtAbgegeben))
                    }
                } label: {
                    FilterPillLabel(name: Copy.filterVote, value: choice?.label)
                }
                Spacer(minLength: 0)
            }
            LazyVStack(alignment: .leading, spacing: 0) {
                ForEach(filtered) { entry in
                    MemberVoteRow(entry: entry)
                }
            }
        }
    }

    private var lineValue: String? {
        switch line {
        case "linie": return Copy.filterLine
        case "abw": return Copy.defections
        default: return nil
        }
    }

    private var filtered: [MemberDetailPayload.HistoryEntry] {
        history.filter { entry in
            let lineOk: Bool = {
                switch line {
                case "abw": return entry.defected == true
                case "linie": return entry.defected == false
                default: return true
                }
            }()
            return lineOk && (choice == nil || entry.choice == choice)
        }
    }
}
