import SwiftUI

struct MotionTimelineView: View {
    let stages: [MotionStage]

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            ForEach(Array(stages.enumerated()), id: \.element.id) { index, stage in
                VStack(spacing: ThemeTokens.Spacing.xs) {
                    Text(stage.label)
                        .font(.system(size: ThemeTokens.Text.s, weight: emphasized(stage) ? .semibold : .regular))
                        .textCase(.uppercase)
                        .tracking(0.9)
                        .foregroundStyle(labelColor(stage))
                        .multilineTextAlignment(.center)
                    Text(stage.sub ?? " ")
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                        .multilineTextAlignment(.center)
                    HStack(spacing: 0) {
                        Rectangle().fill(index > 0 ? ThemeColor.border : .clear).frame(height: 1)
                        dot(stage)
                        Rectangle().fill(index < stages.count - 1 ? ThemeColor.border : .clear).frame(height: 1)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    private func emphasized(_ stage: MotionStage) -> Bool {
        stage.state == .success || stage.state == .danger
    }

    private func labelColor(_ stage: MotionStage) -> Color {
        switch stage.state {
        case .success: return ThemeColor.success
        case .danger: return ThemeColor.danger
        default: return ThemeColor.secondary
        }
    }

    @ViewBuilder private func dot(_ stage: MotionStage) -> some View {
        switch stage.state {
        case .pending:
            Circle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s).frame(width: 8, height: 8)
        case .done:
            Circle().fill(ThemeColor.fg).frame(width: 8, height: 8)
        case .success:
            Circle().fill(ThemeColor.success).frame(width: 8, height: 8)
        case .danger:
            Circle().fill(ThemeColor.danger).frame(width: 8, height: 8)
        }
    }
}
