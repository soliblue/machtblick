import Foundation

struct HemicycleSeat {
    let angle: Double
    let radius: Double
}

enum HemicycleLayout {
    enum Spread {
        case centered
        case edge
    }

    static func seats(total: Int, radii: [Double], spread: Spread) -> [HemicycleSeat] {
        let sum = radii.reduce(0, +)
        var counts = radii.map { Int(Double(total) * $0 / sum) }
        var leftover = total - counts.reduce(0, +)
        let remainders = radii.enumerated()
            .map { (index, radius) in (index, Double(total) * radius / sum - Double(counts[index])) }
            .sorted { $0.1 > $1.1 }
        for (index, _) in remainders where leftover > 0 {
            counts[index] += 1
            leftover -= 1
        }
        var seats: [HemicycleSeat] = []
        for (row, count) in counts.enumerated() where count > 0 {
            for k in 0..<count {
                let t =
                    spread == .centered
                    ? (Double(k) + 0.5) / Double(count)
                    : count == 1 ? 0.5 : Double(k) / Double(count - 1)
                seats.append(HemicycleSeat(angle: .pi - t * .pi, radius: radii[row]))
            }
        }
        return seats.sorted { $0.angle == $1.angle ? $0.radius < $1.radius : $0.angle > $1.angle }
    }
}
