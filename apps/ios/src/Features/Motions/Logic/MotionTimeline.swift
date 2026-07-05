import Foundation

enum MotionStatusBucket {
    case angenommen
    case abgelehnt
    case nichtBeraten
    case imVerfahren

    static func of(_ stand: String?) -> MotionStatusBucket {
        guard let stand, !stand.isEmpty else { return .nichtBeraten }
        if ["Angenommen", "Verabschiedet", "Verkündet", "Abgeschlossen"].contains(stand) { return .angenommen }
        if stand == "Abgelehnt" { return .abgelehnt }
        if stand.contains("Noch nicht beraten") { return .nichtBeraten }
        return .imVerfahren
    }
}

enum MotionStageState {
    case done
    case pending
    case success
    case danger
}

struct MotionStage: Identifiable {
    let key: String
    let label: String
    let sub: String?
    let state: MotionStageState

    var id: String { key }
}

enum MotionTimeline {
    static func stages(
        type: String, beratungsstand: String?, introducedDate: String?,
        firstVote: MotionDetailPayload.LinkedVote?
    ) -> [MotionStage] {
        let bucket = MotionStatusBucket.of(beratungsstand)
        let decision: VoteResult? =
            firstVote?.result ?? (bucket == .angenommen ? .angenommen : bucket == .abgelehnt ? .abgelehnt : nil)
        let committeeReached = bucket != .nichtBeraten
        let verkuendet = type == "gesetzentwurf" && beratungsstand == "Verkündet"

        var stages: [MotionStage] = [
            MotionStage(
                key: "eingebracht", label: Copy.introducedLabel,
                sub: introducedDate.map(Formatters.shortDate), state: .done),
            MotionStage(
                key: "ausschuss", label: Copy.stageCommittee, sub: committeeReached ? "✓" : nil,
                state: committeeReached ? .done : .pending),
        ]
        var voteSub: String?
        if let decision {
            var parts = [decision.label]
            if let firstVote { parts.append(Formatters.dayMonth(firstVote.date)) }
            voteSub = parts.joined(separator: " · ")
        }
        let voteState: MotionStageState =
            decision == .angenommen ? .success : decision == .abgelehnt ? .danger : .pending
        stages.append(MotionStage(key: "abstimmung", label: Copy.stageVote, sub: voteSub, state: voteState))
        if verkuendet {
            stages.append(MotionStage(key: "verkuendet", label: Copy.stageEnacted, sub: nil, state: .success))
        }
        return stages
    }

    static func statusStamp(_ beratungsstand: String?, hasVote: Bool) -> String? {
        guard !hasVote, let stand = beratungsstand else { return nil }
        switch stand {
        case "Abgelehnt": return Copy.rejected
        case "Angenommen": return Copy.accepted
        case "Überwiesen": return Copy.stampUeberwiesen
        case "Beschlussempfehlung liegt vor": return Copy.stampBeschlussempfehlung
        default: return stand.contains("Noch nicht beraten") ? Copy.stampNichtBeraten : nil
        }
    }
}
