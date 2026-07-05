import SwiftUI

struct PartySeatMapView: View {
    let parties: [PartyListItem]

    var body: some View {
        Canvas { context, size in
            draw(context: &context, size: size)
        }
        .aspectRatio(1 / 0.55, contentMode: .fit)
    }

    private func draw(context: inout GraphicsContext, size: CGSize) {
        let total: Int = parties.reduce(0) { $0 + $1.seats }
        if total > 0 {
            let rows: Int = min(max(Int((Double(total) / 4).squareRoot().rounded()), 4), 10)
            let drawRadius: Double = size.width / 2 - 8
            let radii: [Double] = (0..<rows).map { row in
                (0.55 + Double(row) / Double(rows - 1) * 0.45) * drawRadius
            }
            let dotRadius: Double = (drawRadius * 0.45) / Double(rows) / 2.4
            let cx: Double = size.width / 2
            let cy: Double = size.height - 8
            let boundaries: [(Int, Color)] = seatBoundaries()
            let seats: [HemicycleSeat] = HemicycleLayout.seats(total: total, radii: radii, spread: .edge)
            for (index, seat) in seats.enumerated() {
                let x: Double = cx + cos(seat.angle) * seat.radius
                let y: Double = cy - sin(seat.angle) * seat.radius
                let rect = CGRect(
                    x: x - dotRadius, y: y - dotRadius, width: 2 * dotRadius, height: 2 * dotRadius)
                context.fill(Path(rect), with: .color(seatColor(index, boundaries: boundaries)))
            }
        }
    }

    private func seatBoundaries() -> [(Int, Color)] {
        let seated = parties.sorted { seatingIndex($0.party) < seatingIndex($1.party) }
        var boundaries: [(Int, Color)] = []
        var running = 0
        for party in seated {
            running += party.seats
            boundaries.append((running, PartyStyle.color(party.party)))
        }
        return boundaries
    }

    private func seatColor(_ index: Int, boundaries: [(Int, Color)]) -> Color {
        boundaries.first { index < $0.0 }?.1 ?? ThemeColor.gray
    }

    private func seatingIndex(_ party: String) -> Int {
        PartyStyle.seatingOrder.firstIndex(of: party) ?? PartyStyle.seatingOrder.count
    }
}
