import SwiftUI

extension Font {
    static func display(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .custom(weight == .bold ? "Fraunces-Bold" : "Fraunces-SemiBold", size: size)
    }

    static func serif(_ size: CGFloat) -> Font {
        .custom("Lora-Regular", size: size)
    }

    static func serif(_ size: CGFloat, bold: Bool, italic: Bool) -> Font {
        let face = bold && italic ? "Lora-BoldItalic" : bold ? "Lora-Bold" : italic ? "Lora-Italic" : "Lora-Regular"
        return .custom(face, size: size)
    }
}
