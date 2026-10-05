enum VoteResultColumn: String, Identifiable {
    case yes
    case no
    case abstain
    case absent
    case unknown

    var id: String { rawValue }
}
