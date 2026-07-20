import SwiftUI

@Observable
final class ScrollPositionModel {
    var y: Double = 0
    var position = ScrollPosition(edge: .top)

    var binding: Binding<ScrollPosition> {
        Binding(get: { self.position }, set: { self.position = $0 })
    }
}
