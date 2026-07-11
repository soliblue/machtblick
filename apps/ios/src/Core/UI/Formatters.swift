import Foundation

enum Formatters {
    private static let isoParser: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter
    }()

    static func shortDate(_ iso: String) -> String {
        isoParser.date(from: iso)?.formatted(
            .dateTime.day().month(.abbreviated).year().locale(AppLocale.current.locale)) ?? iso
    }

    static func longDate(_ iso: String) -> String {
        isoParser.date(from: iso)?.formatted(
            .dateTime.day().month(.wide).year().locale(AppLocale.current.locale)) ?? iso
    }

    static func dayMonth(_ iso: String) -> String {
        isoParser.date(from: iso)?.formatted(
            .dateTime.day(.twoDigits).month(.twoDigits).locale(AppLocale.current.locale)) ?? iso
    }

    static func dateTime(_ value: Date) -> String {
        value.formatted(
            .dateTime.day().month(.abbreviated).year().hour().minute().locale(AppLocale.current.locale))
    }

    static func percent(_ value: Double, fractionDigits: Int = 0) -> String {
        value.formatted(
            .percent.precision(.fractionLength(fractionDigits)).locale(AppLocale.current.locale))
    }

    static func euro(_ amount: Int) -> String {
        amount.formatted(
            .currency(code: "EUR").precision(.fractionLength(0)).locale(AppLocale.current.locale))
    }
}
