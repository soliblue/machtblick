import SwiftUI
import UIKit

enum ThemeColor {
    static let background = adaptive(light: 0xFFFFFF, dark: 0x000000)
    static let surface = adaptive(light: 0xF7F7F7, dark: 0x1C1C1E)
    static let elevated = adaptive(light: 0xEDEDED, dark: 0x2C2C2E)
    static let fg = adaptive(light: 0x0A0A0A, dark: 0xFFFFFF)

    static let blue = Color(hex: 0x6E9BF0)
    static let green = Color(hex: 0x34C759)
    static let red = Color(hex: 0xFF3B30)
    static let purple = Color(hex: 0xB98AEF)
    static let orange = Color(hex: 0xDB9A6A)
    static let cyan = Color(hex: 0x78CCE1)
    static let pink = Color(hex: 0xDE97BE)
    static let yellow = Color(hex: 0xD2BF72)
    static let teal = Color(hex: 0x71C4B4)
    static let indigo = Color(hex: 0x98A3F1)
    static let mint = Color(hex: 0x93D4B6)
    static let brown = Color(hex: 0xB89073)
    static let gray = Color(hex: 0x828CA0)
    static let rust = Color(hex: 0xDE7630)

    static let success = Color(hex: 0x7AB87A)
    static let danger = Color(hex: 0xB54E5E)
    static let onSuccess = Color(hex: 0x0A0A0A)
    static let onDanger = Color(hex: 0xFFFFFF)
    static let onYellow = Color(hex: 0x0A0A0A)

    static let border = fg.opacity(ThemeTokens.Opacity.s)
    static let secondary = fg.opacity(ThemeTokens.Opacity.l)

    private static func adaptive(light: UInt32, dark: UInt32) -> Color {
        Color(uiColor: UIColor { traits in
            let hex = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(
                red: CGFloat((hex >> 16) & 0xFF) / 255,
                green: CGFloat((hex >> 8) & 0xFF) / 255,
                blue: CGFloat(hex & 0xFF) / 255,
                alpha: 1)
        })
    }
}

extension Color {
    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}
