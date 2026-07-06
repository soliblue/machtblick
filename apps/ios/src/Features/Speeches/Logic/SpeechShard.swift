enum SpeechShard {
    static let count = 4

    static func of(_ id: String) -> Int {
        var h: Int32 = 0
        for unit in id.utf16 { h = h &* 31 &+ Int32(unit) }
        return abs(Int(h)) % count
    }
}
