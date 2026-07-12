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
        precondition(legacy.needsEnrichmentRefresh)

        let enriched = try JSONDecoder().decode(
            MemberDetailPayload.self,
            from: Data(
                #"{"id":"member","name":"Member","party":"Die Linke","state":"Bremen","attendance":1,"votesAppeared":1,"defections":0,"history":[{"voteId":"vote","date":"2026-07-11","title":"Title","cleanTitle":"Title","result":"angenommen","choice":"ja","party":"Die Linke","partyMajority":"ja","defected":false,"proposingParty":"Die Linke","partySummaries":[{"party":"Die Linke","position":"yes","members":64,"yes":60,"no":2,"abstain":1,"absent":1}]}],"speeches":[]}"#.utf8))
        precondition(enriched.history[0].proposingParty == "Die Linke")
        precondition(enriched.history[0].partySummaries?.first?.yes == 60)
        precondition(enriched.history[0].partySummaries?.first?.party == enriched.history[0].party)
        precondition(!enriched.needsEnrichmentRefresh)

        let fraktionslos = try JSONDecoder().decode(
            MemberDetailPayload.self,
            from: Data(
                #"{"id":"member","name":"Member","party":"fraktionslos","state":"Schleswig-Holstein","attendance":1,"votesAppeared":1,"defections":0,"history":[{"voteId":"vote","date":"2026-07-11","title":"Title","cleanTitle":"Title","result":"angenommen","choice":"ja","party":"fraktionslos","partyMajority":null,"defected":null,"proposingParty":null,"partySummaries":[{"party":"fraktionslos","position":"yes","members":1,"yes":1,"no":0,"abstain":0,"absent":0}]}],"speeches":[]}"#.utf8))
        precondition(fraktionslos.history[0].partyMajority == nil)
        precondition(!fraktionslos.history[0].showsLineStatus)
        precondition(!fraktionslos.needsEnrichmentRefresh)
        print("Legacy member payloads trigger enrichment refresh and current payloads stay cacheable.")
    }
}
