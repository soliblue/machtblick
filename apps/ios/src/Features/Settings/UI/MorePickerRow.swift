import SwiftUI

struct MorePickerRow<SelectionValue: Hashable>: View {
    let title: String
    let systemImage: String
    let value: String
    let identifier: String
    @Binding var selection: SelectionValue
    let options: [SelectionValue]
    let optionName: (SelectionValue) -> String

    init(
        title: String,
        systemImage: String,
        value: String,
        identifier: String,
        selection: Binding<SelectionValue>,
        options: [SelectionValue],
        optionName: @escaping (SelectionValue) -> String
    ) {
        self.title = title
        self.systemImage = systemImage
        self.value = value
        self.identifier = identifier
        self._selection = selection
        self.options = options
        self.optionName = optionName
    }

    var body: some View {
        Menu {
            ForEach(options, id: \.self) { option in
                Button {
                    selection = option
                } label: {
                    if option == selection {
                        Label(optionName(option), systemImage: "checkmark")
                    } else {
                        Text(optionName(option))
                    }
                }
            }
        } label: {
            HStack(spacing: ThemeTokens.Spacing.m) {
                Image(systemName: systemImage)
                    .font(.system(size: ThemeTokens.Icon.m))
                    .frame(width: ThemeTokens.Icon.l)
                    .accessibilityHidden(true)
                Text(title)
                    .font(.system(size: ThemeTokens.Text.l))
                Spacer()
                HStack(spacing: ThemeTokens.Spacing.xs) {
                    Text(value)
                        .font(.system(size: ThemeTokens.Text.l))
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: ThemeTokens.Icon.s))
                }
                .foregroundStyle(ThemeColor.secondary)
            }
            .frame(maxWidth: .infinity)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .tint(ThemeColor.fg)
        .accessibilityLabel(title)
        .accessibilityValue(value)
        .accessibilityIdentifier(identifier)
        .foregroundStyle(ThemeColor.fg)
        .padding(.vertical, ThemeTokens.Spacing.l)
    }
}
