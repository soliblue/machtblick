import SwiftUI
import UIKit

private final class SearchClearButtonRemover: NSObject {
    static let shared = SearchClearButtonRemover()
    private var installed = false

    func install() {
        guard !installed else { return }
        NotificationCenter.default.addObserver(
            self, selector: #selector(fieldDidBeginEditing),
            name: UITextField.textDidBeginEditingNotification, object: nil)
        installed = true
    }

    @objc private func fieldDidBeginEditing(_ note: Notification) {
        (note.object as? UISearchTextField)?.clearButtonMode = .never
    }
}

private struct SearchDismiss: ViewModifier {
    @Environment(\.isSearching) private var isSearching
    @Binding var text: String

    func body(content: Content) -> some View {
        content
            .onAppear { SearchClearButtonRemover.shared.install() }
            .onChange(of: isSearching) { _, active in
                if !active { text = "" }
            }
    }
}

extension View {
    func clearsQueryOnSearchDismiss(_ text: Binding<String>) -> some View {
        modifier(SearchDismiss(text: text))
    }
}
