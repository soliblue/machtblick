import SwiftUI

struct AvatarPile: View {
    struct Person: Identifiable, Hashable {
        let id: String
        let name: String
        let pictureUrl: String?
    }

    let people: [Person]
    var cap = 8

    private var visible: [Person] { Array(people.prefix(cap)) }
    private var overflow: Int { max(0, people.count - cap) }

    var body: some View {
        if !people.isEmpty {
            HStack(spacing: -10) {
                ForEach(Array(visible.enumerated()), id: \.element.id) { index, person in
                    NavigationLink(value: AppRoute.member(person.id)) {
                        MemberAvatar(
                            name: person.name, url: HTTPClient.absolute(person.pictureUrl), size: 32, circle: true)
                        .overlay(Circle().strokeBorder(ThemeColor.background, lineWidth: 1.5))
                    }
                    .buttonStyle(.plain)
                    .zIndex(Double(visible.count - index))
                }
                if overflow > 0 {
                    Text("+\(overflow)")
                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                        .foregroundStyle(ThemeColor.secondary)
                        .frame(width: 32, height: 32)
                        .background(Circle().fill(ThemeColor.surface))
                        .overlay(Circle().strokeBorder(ThemeColor.background, lineWidth: 1.5))
                }
            }
        }
    }
}
