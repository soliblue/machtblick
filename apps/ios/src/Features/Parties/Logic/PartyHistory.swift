import Foundation

struct PartyHistory: Decodable {
    struct Point: Decodable {
        let termNumber: Int
        let year: Int
        let seats: Int
        let totalSeats: Int
        let pctOfTotal: Double
        let partyNameAtTime: String
    }

    struct Event: Decodable {
        let date: String
        let type: String
        let labelDe: String
        let side: String
    }

    let points: [Point]
    let events: [Event]

    var chartPoints: [Point] {
        var byTerm: [Int: Point] = [:]
        for point in points where (byTerm[point.termNumber]?.seats ?? -1) < point.seats {
            byTerm[point.termNumber] = point
        }
        return byTerm.values.sorted { $0.termNumber < $1.termNumber }
    }

    func anchoredEvents(_ pts: [Point]) -> [AnchoredEvent] {
        let first = pts.first!
        let last = pts.last!
        return events.map { event in
            let eventYear = Int(event.date.prefix(4)) ?? first.year
            let leading = eventYear < first.year
            var anchor = first.termNumber
            if !leading {
                for point in pts.reversed() where eventYear >= point.year {
                    anchor = point.termNumber
                    break
                }
            }
            return AnchoredEvent(
                date: event.date, type: event.type, labelDe: event.labelDe,
                anchorTerm: min(max(anchor, first.termNumber), last.termNumber), leading: leading)
        }
    }
}
