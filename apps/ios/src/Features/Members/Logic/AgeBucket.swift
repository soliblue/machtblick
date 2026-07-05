import Foundation

enum AgeBucket: String, CaseIterable {
    case under30
    case age30
    case age40
    case age50
    case age60
    case age70

    var label: String {
        switch self {
        case .under30: return Copy.ageUnder30
        case .age30: return Copy.age30
        case .age40: return Copy.age40
        case .age50: return Copy.age50
        case .age60: return Copy.age60
        case .age70: return Copy.age70
        }
    }

    static func of(_ yearOfBirth: Int?) -> AgeBucket? {
        guard let yearOfBirth else { return nil }
        let age = Calendar.current.component(.year, from: Date()) - yearOfBirth
        switch age {
        case ..<30: return .under30
        case ..<40: return .age30
        case ..<50: return .age40
        case ..<60: return .age50
        case ..<70: return .age60
        default: return .age70
        }
    }
}
