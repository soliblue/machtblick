import Foundation

struct BrowserDestination: Identifiable {
    let url: URL

    var id: URL { url }
}
