enum VoteFlagFilter: String, CaseIterable {
    case all
    case saved
    case seen
    case unseen

    var label: String {
        switch self {
        case .all: return Copy.filterAll
        case .saved: return Copy.flagSaved
        case .seen: return Copy.flagSeen
        case .unseen: return Copy.flagUnseen
        }
    }
}
