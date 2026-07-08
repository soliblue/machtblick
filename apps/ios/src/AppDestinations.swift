import SwiftUI

extension View {
    func appDestinations(cache: ApiCache) -> some View {
        navigationDestination(for: AppRoute.self) { route in
            switch route {
            case .vote(let id):
                VoteDetailView(id: id, cache: cache)
            case .member(let id):
                MemberDetailView(id: id, cache: cache)
            case .party(let slug):
                PartyDetailView(slug: slug, cache: cache)
            case .motion(let id):
                MotionDetailView(id: id, cache: cache)
            case .proposals(let party, let voteIds):
                PartyProposalsFeed(party: party, voteIds: voteIds, cache: cache)
            }
        }
    }
}
