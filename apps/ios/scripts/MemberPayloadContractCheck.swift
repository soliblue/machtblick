import Foundation

struct PartyVoteSummary: Decodable {
    let party: String
    let position: PartyPosition
    let members: Int?
    let yes: Int
    let no: Int
    let abstain: Int
    let absent: Int
}

@main
struct MemberPayloadContractCheck {
    static func main() throws {
        let legacy = try JSONDecoder().decode(
            MemberDetailPayload.self,
            from: Data(
                #"{"id":"member","name":"Member","party":"SPD","state":"Berlin","attendance":1,"votesAppeared":1,"defections":0,"history":[{"voteId":"vote","date":"2026-07-11","title":"Title","cleanTitle":"Title","result":"angenommen","choice":"ja","party":"SPD","partyMajority":"ja","defected":false}],"speeches":[]}"#.utf8))
        precondition(legacy.history[0].proposingParty == nil)
        precondition(legacy.history[0].partySummaries == nil)

        let enriched = try JSONDecoder().decode(
            MemberDetailPayload.self,
            from: Data(
                #"{"id":"member","name":"Member","party":"SPD","state":"Berlin","attendance":1,"votesAppeared":1,"defections":0,"history":[{"voteId":"vote","date":"2026-07-11","title":"Title","cleanTitle":"Title","result":"angenommen","choice":"ja","party":"SPD","partyMajority":"ja","defected":false,"proposingParty":"SPD","partySummaries":[{"party":"SPD","position":"yes","members":120,"yes":100,"no":10,"abstain":5,"absent":5}]}],"speeches":[]}"#.utf8))
        precondition(enriched.history[0].proposingParty == "SPD")
        precondition(enriched.history[0].partySummaries?.first?.yes == 100)
        print("Legacy and enriched member payloads decode through the shipping DTO.")
    }
}
