enum Endpoints {
    static let members = "/api/members.json"
    static let votes = "/api/votes.json"
    static let parties = "/api/parties.json"
    static let speechesMeta = "/speeches-meta.json"

    static func member(_ id: String) -> String { "/members/\(id).json" }
    static func vote(_ id: String) -> String { "/votes/\(id).json" }
    static func motion(_ id: Int) -> String { "/motions/\(id).json" }
    static func party(_ slug: String) -> String { "/parties/\(slug).json" }
    static func speechesSearchShard(_ shard: Int) -> String { "/speeches-search-\(shard).json" }
    static func memberPhoto(_ memberId: String) -> String { "/members-photos/\(memberId).jpg" }
}
