import SwiftUI

struct MemberDetailPanel: View {
    let detail: MemberDetailPayload
    let tab: MemberDetailTab
    let cache: ApiCache

    var body: some View {
        switch tab {
        case .votes:
            MemberVotesPanel(history: detail.history)
        case .speeches:
            MemberSpeechesPanel(memberId: detail.id, speeches: detail.speeches, cache: cache)
        }
    }
}
