import Foundation
import SwiftUI

enum AppTheme: String, CaseIterable, Identifiable, Sendable {
    case system
    case light
    case dark

    var id: String { rawValue }

    static var persisted: AppTheme {
        get {
            AppTheme(rawValue: UserDefaults.standard.string(forKey: "appTheme") ?? "")
                ?? .light
        }
        set {
            UserDefaults.standard.set(newValue.rawValue, forKey: "appTheme")
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}
