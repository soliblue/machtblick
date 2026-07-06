import SwiftUI

struct EyesLogo: View {
    var height: CGFloat = 20
    var pupilDrift: Double = 0

    private var scale: CGFloat { height / 36 }

    var body: some View {
        Canvas { ctx, _ in
            ctx.scaleBy(x: scale, y: scale)

            let leftEye = Path { p in
                p.move(to: CGPoint(x: 8.4, y: 16.8))
                p.addCurve(to: CGPoint(x: 21, y: 10.2), control1: CGPoint(x: 12.2, y: 12.2), control2: CGPoint(x: 16.3, y: 10.2))
                p.addCurve(to: CGPoint(x: 35, y: 19), control1: CGPoint(x: 27, y: 10.2), control2: CGPoint(x: 31.1, y: 12.7))
                p.addCurve(to: CGPoint(x: 21, y: 27.8), control1: CGPoint(x: 31.1, y: 25.3), control2: CGPoint(x: 27, y: 27.8))
                p.addCurve(to: CGPoint(x: 8.4, y: 21.2), control1: CGPoint(x: 16.3, y: 27.8), control2: CGPoint(x: 12.2, y: 25.8))
                p.addCurve(to: CGPoint(x: 8.4, y: 16.8), control1: CGPoint(x: 7.6, y: 20.2), control2: CGPoint(x: 7.6, y: 17.8))
                p.closeSubpath()
            }
            let rightEye = Path { p in
                p.move(to: CGPoint(x: 73.6, y: 16.8))
                p.addCurve(to: CGPoint(x: 61, y: 10.2), control1: CGPoint(x: 69.8, y: 12.2), control2: CGPoint(x: 65.7, y: 10.2))
                p.addCurve(to: CGPoint(x: 47, y: 19), control1: CGPoint(x: 55, y: 10.2), control2: CGPoint(x: 50.9, y: 12.7))
                p.addCurve(to: CGPoint(x: 61, y: 27.8), control1: CGPoint(x: 50.9, y: 25.3), control2: CGPoint(x: 55, y: 27.8))
                p.addCurve(to: CGPoint(x: 73.6, y: 21.2), control1: CGPoint(x: 65.7, y: 27.8), control2: CGPoint(x: 69.8, y: 25.8))
                p.addCurve(to: CGPoint(x: 73.6, y: 16.8), control1: CGPoint(x: 74.4, y: 20.2), control2: CGPoint(x: 74.4, y: 17.8))
                p.closeSubpath()
            }
            let brows = Path { p in
                p.move(to: CGPoint(x: 9, y: 3.8))
                p.addCurve(to: CGPoint(x: 32, y: 3.5), control1: CGPoint(x: 16, y: 1.6), control2: CGPoint(x: 24, y: 1.4))
                p.move(to: CGPoint(x: 50, y: 3.5))
                p.addCurve(to: CGPoint(x: 73, y: 3.8), control1: CGPoint(x: 58, y: 1.4), control2: CGPoint(x: 66, y: 1.6))
            }

            let eyeStyle = StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round)
            ctx.stroke(leftEye, with: .color(ThemeColor.fg), style: eyeStyle)
            ctx.stroke(rightEye, with: .color(ThemeColor.fg), style: eyeStyle)
            ctx.stroke(brows, with: .color(ThemeColor.fg), style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round))

            var pupils = ctx
            pupils.translateBy(x: 0, y: CGFloat(pupilDrift) * 1.6)
            pupils.fill(Path(ellipseIn: CGRect(x: 17.2, y: 15.2, width: 7.6, height: 7.6)), with: .color(ThemeColor.fg))
            pupils.fill(Path(ellipseIn: CGRect(x: 57.2, y: 15.2, width: 7.6, height: 7.6)), with: .color(ThemeColor.danger))
        }
        .frame(width: height * 82 / 36, height: height)
    }
}
