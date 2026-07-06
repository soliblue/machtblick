import SwiftUI

struct SpeechEntry: View {
    let speech: SpeechSummary
    var nested = false
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                SpeakerAvatar(name: speech.speakerName, pictureUrl: speech.pictureUrl, size: nested ? 28 : 36)
                    .padding(.leading, nested ? ThemeTokens.Spacing.xs : 0)
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                    if nested {
                        Text(Copy.zwischenfrage).kicker()
                    }
                    header
                    Text(speech.excerpt)
                        .font(.serif(ThemeTokens.Text.m))
                        .foregroundStyle(ThemeColor.fg)
                        .lineLimit(nested ? nil : 4)
                        .multilineTextAlignment(.leading)
                    affordance
                }
                Spacer(minLength: 0)
            }
            .padding(.top, nested ? ThemeTokens.Spacing.l : ThemeTokens.Spacing.xl)
            .padding(.leading, nested ? ThemeTokens.Spacing.m : 0)
        }
        .buttonStyle(.plain)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                if let party = speech.party, PartyStyle.hasLogo(party) {
                    PartyLogo(party: party, size: ThemeTokens.Icon.m)
                }
                Text(speech.speakerName)
                    .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                    .foregroundStyle(ThemeColor.fg)
                Spacer(minLength: 0)
                if let choice = speech.choice, choice != .nichtAbgegeben {
                    StampView(label: choice.label, color: choice.color)
                }
            }
            if let role = speech.speakerRole {
                Text(role)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
        }
    }

    private var affordance: some View {
        HStack(spacing: ThemeTokens.Spacing.xs) {
            Text(Copy.readFullSpeech)
                .font(.system(size: ThemeTokens.Text.s))
            Image(systemName: "chevron.right").font(.system(size: ThemeTokens.Text.s))
            Spacer(minLength: 0)
        }
        .foregroundStyle(ThemeColor.secondary)
        .padding(.top, ThemeTokens.Spacing.xs)
    }
}
