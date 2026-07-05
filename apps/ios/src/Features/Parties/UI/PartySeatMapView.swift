import SwiftUI

struct PartySeatMapView: View {
    let parties: [PartyListItem]

    var body: some View {
        Canvas { context, size in
            let total = parties.reduce(0) { $0 + $1.seats }
            if total > 0 {
                let rows = min(max(Int((Double(total) / 4).squareRoot().rounded()), 4), 10)
                let drawRadius = size.width / 2 - 8
                let radii = (0..<rows).map { (0.55 + Double($0) / Double(rows - 1) * 0.45) * drawRadius }
                let dotRadius = (drawRadius * 0.45) / Double(rows) / 2.4
                let cx = size.width / 2
                let cy = size.height - 8
                let seated = parties.sorted {
                    seatingIndex($0.party) < seatingIndex($1.party)
                }
                var boundaries: [(Int, Color)] = []
                var running = 0
                for party in seated {
                    running += party.seats
                    boundaries.append((running, PartyStyle.color(party.party)))
                }
                for (index, seat) in HemicycleLayout.seats(total: total, radii: radii, spread: .edge)
                    .enumerated()
                {
                    let x = cx + cos(seat.angle) * seat.radius
                    let y = cy - sin(seat.angle) * seat.radius
                    let color = boundaries.first { index < $0.0 }?.1 ?? ThemeColor.gray
                    context.fill(
                        Path(
                            CGRect(
                                x: x - dotRadius, y: y - dotRadius, width: 2 * dotRadius,
                                height: 2 * dotRadius)),
                        with: .color(color))
                }
            }
        }
        .aspectRatio(1 / 0.55, contentMode: .fit)
    }

    private func seatingIndex(_ party: String) -> Int {
        PartyStyle.seatingOrder.firstIndex(of: party) ?? PartyStyle.seatingOrder.count
    }
}
