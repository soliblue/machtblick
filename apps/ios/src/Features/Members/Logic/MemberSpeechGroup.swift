import Foundation

struct MemberSpeechGroup: Identifiable {
    let id: String
    let date: String
    let voteId: String?
    let voteTitle: String?
    let agendaTitle: String?
    let agendaItem: String?
    let speeches: [MemberDetailPayload.SpeechEntry]
    let main: MemberDetailPayload.SpeechEntry
    let shortCount: Int

    var title: String {
        voteTitle ?? agendaTitle ?? agendaItem ?? Copy.speechesSection
    }
}

enum MemberSpeechGrouping {
    private static func key(_ speech: MemberDetailPayload.SpeechEntry) -> String {
        if let group = speech.debateGroupId, !group.isEmpty { return group }
        return "\(speech.date)\u{0}\(speech.agendaItem ?? speech.voteId ?? speech.id)"
    }

    private static func isShort(_ speech: MemberDetailPayload.SpeechEntry) -> Bool {
        if let type = speech.contributionType { return type == "short" }
        return speech.excerpt.split(separator: " ").count < 24
    }

    static func groups(_ speeches: [MemberDetailPayload.SpeechEntry]) -> [MemberSpeechGroup] {
        var order: [String] = []
        var buckets: [String: [MemberDetailPayload.SpeechEntry]] = [:]
        for speech in speeches {
            let k = key(speech)
            if buckets[k] == nil { order.append(k) }
            buckets[k, default: []].append(speech)
        }
        return order.map { k -> MemberSpeechGroup in
            let items = buckets[k]!.sorted { $0.position < $1.position }
            let main = items.max { $0.excerpt.count < $1.excerpt.count } ?? items[0]
            let voteBearer = items.first { $0.voteId != nil } ?? main
            return MemberSpeechGroup(
                id: k, date: main.date, voteId: voteBearer.voteId, voteTitle: voteBearer.voteTitle,
                agendaTitle: main.agendaTitle, agendaItem: main.agendaItem, speeches: items, main: main,
                shortCount: items.filter(isShort).count)
        }
        .sorted { $0.date > $1.date }
    }

    static func summaries(_ speeches: [MemberDetailPayload.SpeechEntry]) -> [SpeechSummary] {
        speeches.map { entry in
            SpeechSummary(
                id: entry.id, speakerName: entry.speakerName, speakerMemberId: entry.speakerMemberId,
                speakerRole: entry.speakerRole, party: entry.party, excerpt: entry.excerpt,
                contributionType: entry.contributionType, date: entry.date, choice: nil,
                pictureUrl: entry.speakerMemberId.map { "/members-photos/\($0).jpg" })
        }
    }
}
