import SwiftUI

struct DonationSegment: View {
    let donation: PartyDetailPayload.Donation
    let width: CGFloat
    let shade: Double
    @State private var show = false

    var body: some View {
        Rectangle()
            .fill(ThemeColor.fg.opacity(shade))
            .frame(width: width)
            .contentShape(Rectangle())
            .onTapGesture { show = true }
            .popover(isPresented: $show) {
                DonationTooltip(donation: donation)
                    .presentationCompactAdaptation(.popover)
            }
    }
}
