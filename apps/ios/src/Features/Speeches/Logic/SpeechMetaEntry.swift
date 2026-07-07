import Foundation

struct SpeechMetaEntry: Decodable {
    let id: String
    let speakerName: String
    let speakerMemberId: String?
    let speakerRole: String?
    let party: String?
    let position: Int
    let excerpt: String
    let date: String?
    let contributionType: String?
    let debateGroupId: String?
    let choice: BallotChoice?

    var summary: SpeechSummary {
        SpeechSummary(
            id: id, speakerName: speakerName, speakerMemberId: speakerMemberId,
            speakerRole: speakerRole, party: party, excerpt: excerpt,
            contributionType: contributionType, date: date, choice: choice,
            pictureUrl: speakerMemberId.map { "/members-photos/\($0).jpg" })
    }
}
