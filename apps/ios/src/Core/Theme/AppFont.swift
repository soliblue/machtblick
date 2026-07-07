import SwiftUI

extension Font {
    static func display(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .custom(weight == .bold ? "Fraunces-Bold" : "Fraunces-SemiBold", size: size)
    }

    static func serif(_ size: CGFloat) -> Font {
        .custom("Newsreader", size: size)
    }
}
