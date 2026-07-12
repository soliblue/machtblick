import SwiftUI

struct MorePickerRow<SelectionValue: Hashable, Content: View>: View {
    let title: String
    let systemImage: String
    let value: String
    let identifier: String
    @Binding var selection: SelectionValue
    let content: Content

    init(
        title: String,
        systemImage: String,
        value: String,
        identifier: String,
        selection: Binding<SelectionValue>,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.systemImage = systemImage
        self.value = value
        self.identifier = identifier
        self._selection = selection
        self.content = content()
    }

    var body: some View {
        Picker(selection: $selection) {
            content
        } label: {
            HStack(spacing: ThemeTokens.Spacing.m) {
                Image(systemName: systemImage)
                    .font(.system(size: ThemeTokens.Icon.m))
                    .frame(width: ThemeTokens.Icon.l)
                    .accessibilityHidden(true)
                Text(title)
                    .font(.system(size: ThemeTokens.Text.l))
                Spacer()
                Text(value)
                    .font(.system(size: ThemeTokens.Text.l))
                    .foregroundStyle(ThemeColor.secondary)
            }
            .frame(maxWidth: .infinity)
            .contentShape(Rectangle())
        }
        .pickerStyle(.menu)
        .tint(ThemeColor.fg)
        .accessibilityLabel(title)
        .accessibilityValue(value)
        .accessibilityIdentifier(identifier)
        .foregroundStyle(ThemeColor.fg)
        .padding(.vertical, ThemeTokens.Spacing.l)
    }
}
