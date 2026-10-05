struct VoteResultRow: Identifiable {
    let party: String?
    let yes: Int?
    let no: Int?
    let abstain: Int?
    let absent: Int?
    let unknown: Int?

    var id: String { party ?? "total" }

    init(
        party: String? = nil, members: Int?, yes: Int?, no: Int?, abstain: Int?,
        absent: Int?, voteType: String
    ) {
        self.party = party
        self.yes = yes
        self.no = no
        self.abstain = abstain
        self.absent = voteType == "namentlich" ? absent : nil
        if let members, let yes, let no, let abstain {
            unknown = max(0, members - yes - no - abstain - (self.absent ?? 0))
        } else {
            unknown = nil
        }
    }

    func count(_ column: VoteResultColumn) -> Int? {
        switch column {
        case .yes: return yes
        case .no: return no
        case .abstain: return abstain
        case .absent: return absent
        case .unknown: return unknown
        }
    }
}
