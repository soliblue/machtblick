import Charts
import SwiftUI

struct PartyHistoryChart: View {
    let history: PartyHistory
    let party: String

    var body: some View {
        let points = history.chartPoints
        let events = history.anchoredEvents(points)
        let terms = points.map(\.termNumber)
        let color = PartyStyle.color(party)
        let yMax = (points.map { $0.pctOfTotal * 100 }.max() ?? 0).rounded(.up) + 1
        Chart {
            ForEach(events) { event in
                RuleMark(x: .value("Wahlperiode", event.anchorTerm))
                    .foregroundStyle(ThemeColor.fg.opacity(ThemeTokens.Opacity.m))
                    .lineStyle(StrokeStyle(lineWidth: ThemeTokens.Stroke.s, dash: [4, 4]))
                    .annotation(
                        position: .top, alignment: alignment(event, terms: terms),
                        spacing: ThemeTokens.Spacing.xs
                    ) {
                        eventLabel(event)
                    }
            }
            ForEach(points, id: \.termNumber) { point in
                let pct = point.pctOfTotal * 100
                AreaMark(x: .value("Wahlperiode", point.termNumber), y: .value("Anteil", pct))
                    .interpolationMethod(.monotone)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [color.opacity(ThemeTokens.Opacity.m), color.opacity(0)],
                            startPoint: .top, endPoint: .bottom))
                LineMark(x: .value("Wahlperiode", point.termNumber), y: .value("Anteil", pct))
                    .interpolationMethod(.monotone)
                    .foregroundStyle(color)
                    .lineStyle(StrokeStyle(lineWidth: ThemeTokens.Stroke.l))
                PointMark(x: .value("Wahlperiode", point.termNumber), y: .value("Anteil", pct))
                    .foregroundStyle(color)
                    .symbolSize(40)
                    .annotation(position: .top, spacing: ThemeTokens.Spacing.xs) {
                        Text(percentLabel(pct))
                            .font(.system(size: ThemeTokens.Text.s))
                            .foregroundStyle(ThemeColor.secondary)
                            .monospacedDigit()
                    }
            }
        }
        .chartYScale(domain: 0...yMax)
        .chartYAxis(.hidden)
        .chartXScale(domain: (terms.first ?? 0)...(terms.last ?? 0))
        .chartXAxis {
            AxisMarks(values: terms) { value in
                AxisValueLabel {
                    Text("\(value.as(Int.self) ?? 0).")
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                }
            }
        }
        .frame(height: 260)
        .padding(.top, ThemeTokens.Spacing.xl)
    }

    private func alignment(_ event: AnchoredEvent, terms: [Int]) -> Alignment {
        let lo = Double(terms.first ?? 0)
        let hi = Double(terms.last ?? 0)
        let fraction = hi > lo ? (Double(event.anchorTerm) - lo) / (hi - lo) : 0
        return fraction < 0.5 ? .leading : .trailing
    }

    private func percentLabel(_ pct: Double) -> String {
        String(format: "%.1f", pct).replacingOccurrences(of: ".", with: ",") + "%"
    }

    private func eventLabel(_ event: AnchoredEvent) -> some View {
        HStack(spacing: ThemeTokens.Spacing.xs) {
            Image(systemName: event.systemImage).font(.system(size: ThemeTokens.Icon.s))
            Text(event.labelDe).font(.system(size: ThemeTokens.Text.s))
        }
        .foregroundStyle(ThemeColor.secondary)
        .frame(maxWidth: 140, alignment: .leading)
    }
}
