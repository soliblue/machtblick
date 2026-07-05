struct AnchoredEvent: Identifiable {
    let date: String
    let type: String
    let labelDe: String
    let anchorTerm: Int
    let leading: Bool

    var id: String { "\(date)-\(anchorTerm)" }

    var systemImage: String {
        switch type {
        case "merged_in": return "arrow.down.left"
        case "merged_out", "split_out": return "arrow.down.right"
        case "renamed": return "arrow.triangle.2.circlepath"
        case "founded": return "plus"
        case "dissolved": return "xmark"
        default: return "circle.fill"
        }
    }
}
