enum BallotChoice: String, Decodable {
    case ja
    case nein
    case enthalten
    case nichtAbgegeben = "nicht_abgegeben"
}
