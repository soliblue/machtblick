import SwiftUI

struct DefectorsSection: View {
    let defectors: [VoteDetailPayload.DefectorGroup]

    private var rows: [(party: String, majority: BallotChoice, member: VoteDetailPayload.DefectorMember)] {
        defectors.flatMap { group in
            group.members.map { (group.party, group.majority, $0) }
        }
    }

    var body: some View {
        if !rows.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                Text(Copy.defectorsSection).kicker()
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(rows.enumerated()), id: \.element.member.id) { index, row in
                        DefectorRow(member: row.member, party: row.party, majority: row.majority, showDivider: index > 0)
                    }
                }
            }
        }
    }
}
