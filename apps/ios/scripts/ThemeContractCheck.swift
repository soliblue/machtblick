import Foundation
import SwiftUI

@main
struct ThemeContractCheck {
    static func main() {
        let original = UserDefaults.standard.object(forKey: "appTheme")
        defer {
            if let original {
                UserDefaults.standard.set(original, forKey: "appTheme")
            } else {
                UserDefaults.standard.removeObject(forKey: "appTheme")
            }
        }
        UserDefaults.standard.removeObject(forKey: "appTheme")
        precondition(AppTheme.persisted == .light)
        precondition(AppTheme.system.colorScheme == nil)
        precondition(AppTheme.light.colorScheme == .light)
        precondition(AppTheme.dark.colorScheme == .dark)
        for theme in AppTheme.allCases {
            AppTheme.persisted = theme
            precondition(AppTheme.persisted == theme)
        }
        print("Light default, explicit system mode, and appearance persistence pass.")
    }
}
