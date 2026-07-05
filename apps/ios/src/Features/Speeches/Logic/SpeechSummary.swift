import Foundation

struct SpeechSummary: Identifiable, Hashable {
    let id: String
    let speakerName: String
    let speakerMemberId: String?
    let speakerRole: String?
    let party: String?
    let excerpt: String
    let contributionType: String?
    let date: String?
    var choice: BallotChoice?
    var pictureUrl: String?

    var lastName: String {
        speakerName.split(separator: " ").last.map(String.init) ?? speakerName
    }
}
