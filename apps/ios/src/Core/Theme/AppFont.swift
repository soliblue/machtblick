import SwiftUI

extension Font {
    static func display(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .custom(weight == .bold ? "Fraunces-Bold" : "Fraunces-SemiBold", size: size)
    }

    static func serif(_ size: CGFloat) -> Font {
        .system(size: size, design: .rounded)
    }

    static func serif(_ size: CGFloat, bold: Bool, italic: Bool) -> Font {
        let font = Font.system(size: size, weight: bold ? .bold : .regular, design: .rounded)
        return italic ? font.italic() : font
    }
}
