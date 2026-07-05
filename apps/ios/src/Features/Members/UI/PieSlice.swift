import SwiftUI

struct PieSlice: Identifiable {
    let label: String
    let value: Int
    let color: Color

    var id: String { label }
}

enum Demographics {
    static func gender(_ members: [MemberListItem]) -> [PieSlice] {
        let order: [(String, String, Color)] = [
            ("m", Copy.sexMale, ThemeColor.blue),
            ("f", Copy.sexFemale, ThemeColor.purple),
            ("d", Copy.sexDivers, ThemeColor.rust),
            ("unbekannt", Copy.unknown, ThemeColor.fg.opacity(0.25)),
        ]
        return order.compactMap { key, label, color in
            let count = members.filter { ($0.sex ?? "unbekannt") == key }.count
            return count > 0 ? PieSlice(label: label, value: count, color: color) : nil
        }
        .sorted { $0.value > $1.value }
    }

    static func age(_ members: [MemberListItem]) -> [PieSlice] {
        let ramp = [0.16, 0.30, 0.44, 0.58, 0.73, 0.88]
        return AgeBucket.allCases.enumerated().compactMap { index, bucket in
            let count = members.filter { AgeBucket.of($0.yearOfBirth) == bucket }.count
            return count > 0
                ? PieSlice(label: bucket.label, value: count, color: ThemeColor.fg.opacity(ramp[index]))
                : nil
        }
    }

    static func faction(_ members: [MemberListItem]) -> [PieSlice] {
        PartyStyle.order.compactMap { party in
            let count = members.filter { $0.party == party }.count
            return count > 0
                ? PieSlice(label: PartyStyle.label(party), value: count, color: PartyStyle.color(party))
                : nil
        }
        .sorted { $0.value > $1.value }
    }
}
