enum PartyVoteOrder {
    static func byJaShare(_ summaries: [PartyVoteSummary]) -> [PartyVoteSummary] {
        summaries
            .filter { PartyStyle.hasPartyLine($0.party) }
            .sorted { $0.jaShare > $1.jaShare }
    }
}
