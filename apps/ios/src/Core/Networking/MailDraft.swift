import Foundation

struct MailDraft {
    let recipient: String
    let subject: String
    var body: String?

    var url: URL {
        var components = URLComponents()
        components.scheme = "mailto"
        components.path = recipient
        components.queryItems = [URLQueryItem(name: "subject", value: subject)]
            + (body.map { [URLQueryItem(name: "body", value: $0)] } ?? [])
        return components.url!
    }
}
