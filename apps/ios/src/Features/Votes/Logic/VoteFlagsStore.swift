import Foundation
import Observation

@Observable
final class VoteFlagsStore {
    private(set) var savedIds: Set<String>
    private(set) var seenIds: Set<String>

    private let savedKey = "machtblick.savedVotes"
    private let seenKey = "machtblick.seenVotes"

    init() {
        savedIds = VoteFlagsStore.load(key: "machtblick.savedVotes")
        seenIds = VoteFlagsStore.load(key: "machtblick.seenVotes")
    }

    func isSaved(_ id: String) -> Bool {
        savedIds.contains(id)
    }

    func isSeen(_ id: String) -> Bool {
        seenIds.contains(id)
    }

    func toggleSaved(_ id: String) {
        savedIds.formSymmetricDifference([id])
        persist(savedIds, key: savedKey)
    }

    func toggleSeen(_ id: String) {
        seenIds.formSymmetricDifference([id])
        persist(seenIds, key: seenKey)
    }

    private func persist(_ ids: Set<String>, key: String) {
        UserDefaults.standard.set(try? JSONEncoder().encode(Array(ids)), forKey: key)
    }

    private static func load(key: String) -> Set<String> {
        let data = UserDefaults.standard.data(forKey: key) ?? Data()
        return Set((try? JSONDecoder().decode([String].self, from: data)) ?? [])
    }
}
