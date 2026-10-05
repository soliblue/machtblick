import Foundation

enum AppStoreScreenshotDestination {
    case votes
    case vote(String)
    case motion(Int)
    case member(String)
    case parties
}

enum AppStoreScreenshotScenario: String {
    case currentDecision
    case motionSummary
    case memberDebate
    case memberVotes
    case partyComparison
    case rollCallResults
    case handzeichenResults
    case linkedMotion

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

    static var appTheme: AppTheme {
#if DEBUG
        let arguments = ProcessInfo.processInfo.arguments
        return arguments.firstIndex(of: "-AppStoreScreenshotTheme").flatMap { index in
            arguments.indices.contains(index + 1) ? AppTheme(rawValue: arguments[index + 1]) : nil
        } ?? .light
#else
        .light
#endif
    }

    var destination: AppStoreScreenshotDestination {
        switch self {
        case .currentDecision:
            return .votes
        case .motionSummary:
            return .vote("2026-01-29-993-streichung-des-straftatbestandes-der-politikerbeleidigung")
        case .memberDebate:
            return .vote("2025-12-05-984-gesetzentwurf-zur-modernisierung-des-wehrdienstes")
        case .memberVotes:
            return .member("ruffer-corinna")
        case .partyComparison:
            return .parties
        case .rollCallResults:
            return .vote("2025-12-05-984-gesetzentwurf-zur-modernisierung-des-wehrdienstes")
        case .handzeichenResults:
            return .vote("pp21-81-1-modernisierung-der-okodesign-und-energieverbrauchskennzeichnungsregeln")
        case .linkedMotion:
            return .motion(325558)
        }
    }

    var voteTab: VoteTab {
        switch self {
        case .motionSummary: return .details
        case .memberDebate: return .reden
        default: return .ergebnis
        }
    }

    var readyIdentifier: String {
        "app-store-screenshot-\(rawValue)-ready"
    }
}
