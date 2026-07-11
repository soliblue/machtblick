import Foundation

enum HTTPClient {
    static let base = URL(string: "https://machtblick.de")!

    static func get(_ path: String) async -> Data? {
        if let url = URL(string: path, relativeTo: base) {
            var request = URLRequest(url: url, timeoutInterval: 15)
            request.httpMethod = "GET"
            if let (data, response) = try? await URLSession.shared.data(for: request),
                let http = response as? HTTPURLResponse, http.statusCode == 200
            {
                return data
            }
        }
        return nil
    }

    static func absolute(_ path: String?) -> URL? {
        path.flatMap { URL(string: $0, relativeTo: base) }
    }

    static func page(_ path: String) -> URL {
        URL(string: AppLocale.current.localizedPath(path), relativeTo: base)!.absoluteURL
    }

    static func memberPhoto(_ memberId: String) -> URL? {
        URL(string: "/members-photos/\(memberId).jpg", relativeTo: base)
    }
}
