import Foundation

enum AppStoreScreenshotDestination {
    case votes
    case vote(String)
    case member(String)
    case party(String)
}

enum AppStoreScreenshotScenario: String {
    case currentDecision
    case motionSummary
    case partyArguments
    case memberVotes
    case partyComparison

    static var current: AppStoreScreenshotScenario? {
#if DEBUG
        let arguments = ProcessInfo.processInfo.arguments
        return arguments.firstIndex(of: "-AppStoreScreenshot").flatMap { index in
            arguments.indices.contains(index + 1) ? Self(rawValue: arguments[index + 1]) : nil
        }
#else
        nil
#endif
    }

    static var appLanguage: AppLanguage {
#if DEBUG
        let arguments = ProcessInfo.processInfo.arguments
        return arguments.firstIndex(of: "-AppStoreScreenshotLanguage").flatMap { index in
            arguments.indices.contains(index + 1) ? AppLanguage(rawValue: arguments[index + 1]) : nil
        } ?? .de
#else
        .de
#endif
    }

    var destination: AppStoreScreenshotDestination {
        switch self {
        case .currentDecision:
            return .votes
        case .motionSummary:
            return .vote("pp21-74-13-gesetzentwurf-zur-weiterentwicklung-der-treibhausgasminderungs-quote-schlussabst")
        case .partyArguments:
            return .vote("2026-04-24-999-gesetzentwurf-zur-temporaren-absenkung-der-energiesteuer-fur-kraftstoffe")
        case .memberVotes:
            return .member("ruffer-corinna")
        case .partyComparison:
            return .party("cdu-csu")
        }
    }

    var voteTab: VoteTab {
        switch self {
        case .motionSummary: return .details
        case .partyArguments: return .reden
        default: return .ergebnis
        }
    }

    var readyIdentifier: String {
        "app-store-screenshot-\(rawValue)-ready"
    }
}
