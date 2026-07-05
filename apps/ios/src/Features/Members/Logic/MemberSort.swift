enum MemberSort: CaseIterable {
    case name
    case attendance
    case loyalty

    var label: String {
        switch self {
        case .name: return Copy.sortName
        case .attendance: return Copy.attendance
        case .loyalty: return Copy.line
        }
    }

    var defaultsDescending: Bool {
        self != .name
    }
}
