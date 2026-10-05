import Foundation

@main
struct VoteResultContractCheck {
    static func main() throws {
        let fixtures = URL(fileURLWithPath: CommandLine.arguments[1])
        let rollCall = try JSONDecoder().decode(
            VoteDetailPayload.self,
            from: Data(contentsOf: fixtures.appendingPathComponent("rollcall.json")))
        let rollCallResults = VoteResultsModel(detail: rollCall)
        precondition(rollCall.vote.id == "2025-12-05-984-gesetzentwurf-zur-modernisierung-des-wehrdienstes")
        precondition(rollCall.vote.totalMembers == 630)
        precondition(rollCall.vote.absent == 34)
        precondition(!rollCall.debate.isEmpty)
        precondition(rollCallResults.rows.map(\.party) == [
            nil, "CDU/CSU", "AfD", "SPD", "B90/Grüne", "Die Linke", "fraktionslos",
        ])
        precondition(rollCallResults.columns.map(\.rawValue) == ["yes", "no", "abstain", "absent"])
        precondition(rollCallResults.columns.map { rollCallResults.rows[0].count($0) } == [323, 272, 1, 34])
        precondition(rollCallResults.rows[1].no == 0)
        precondition(rollCallResults.rows[1].absent == 2)
        precondition(rollCallResults.rows.last?.no == 1)
        precondition(rollCallResults.rows.last?.absent == 1)

        let showOfHands = try JSONDecoder().decode(
            VoteDetailPayload.self,
            from: Data(contentsOf: fixtures.appendingPathComponent("handzeichen.json")))
        let showOfHandsResults = VoteResultsModel(detail: showOfHands)
        precondition(showOfHands.vote.voteType == "handzeichen")
        precondition(showOfHands.vote.absent == nil)
        precondition(showOfHandsResults.rows.map(\.party) == [
            nil, "CDU/CSU", "AfD", "SPD", "B90/Grüne", "Die Linke",
        ])
        precondition(showOfHandsResults.columns.map(\.rawValue) == ["yes", "no", "abstain", "absent", "unknown"])
        precondition(showOfHandsResults.rows[0].yes == 328)
        precondition(showOfHandsResults.rows[0].no == 299)
        precondition(showOfHandsResults.rows[0].abstain == 0)
        precondition(showOfHandsResults.rows[0].unknown == 3)
        precondition(showOfHandsResults.rows.allSatisfy { $0.absent == nil })
        precondition(showOfHandsResults.rows[1].no == 0)
        precondition(showOfHandsResults.rows[1].unknown == 0)

        let votes = try JSONDecoder().decode(
            [VoteListItem].self,
            from: Data(contentsOf: fixtures.appendingPathComponent("votes.json")))
        precondition(votes.contains { $0.id == showOfHands.vote.id })
        precondition(votes.first { $0.id == showOfHands.vote.id }?.absent == nil)
        precondition(votes.first { $0.id == showOfHands.vote.id }?.totalMembers == 630)
        precondition(votes.first { $0.id == rollCall.vote.id }?.absent == 34)

        let motion = try JSONDecoder().decode(
            MotionDetailPayload.self,
            from: Data(contentsOf: fixtures.appendingPathComponent("motion.json")))
        precondition(motion.antrag.id == 325558)
        precondition(motion.linkedVotes.count == 1)
        precondition(motion.linkedVotes[0].id == rollCall.vote.id)
        let linkedResults = VoteResultsModel(vote: motion.linkedVotes[0])
        precondition(linkedResults.rows.count == 1)
        precondition(linkedResults.columns.map { linkedResults.rows[0].count($0) } == [323, 272, 1, 34])

        let unavailable = try JSONDecoder().decode(
            MotionDetailPayload.LinkedVote.self,
            from: Data(
                #"{"id":"unknown","date":"2026-01-01","title":"Unknown","cleanTitle":"Unknown","result":"angenommen","voteType":"handzeichen","yes":null,"no":null,"abstain":null,"absent":null,"totalMembers":null}"#.utf8))
        let unavailableResults = VoteResultsModel(vote: unavailable)
        precondition(unavailableResults.columns.allSatisfy {
            unavailableResults.rows[0].count($0) == nil
        })
        precondition(unavailableResults.rows[0].unknown == nil)
        print("Live vote list, roll-call counts, Handzeichen absence, party order, and linked motion compatibility pass.")
    }
}
