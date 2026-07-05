import Foundation

enum Formatters {
    private static let isoParser: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "de_DE")
        return formatter
    }()

    private static let shortPrinter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "d. MMM yyyy"
        formatter.locale = Locale(identifier: "de_DE")
        return formatter
    }()

    private static let longPrinter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "d. MMMM yyyy"
        formatter.locale = Locale(identifier: "de_DE")
        return formatter
    }()

    private static let dayMonthPrinter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd.MM."
        formatter.locale = Locale(identifier: "de_DE")
        return formatter
    }()

    private static let euroPrinter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "EUR"
        formatter.maximumFractionDigits = 0
        formatter.locale = Locale(identifier: "de_DE")
        return formatter
    }()

    static func shortDate(_ iso: String) -> String {
        isoParser.date(from: iso).map { shortPrinter.string(from: $0) } ?? iso
    }

    static func longDate(_ iso: String) -> String {
        isoParser.date(from: iso).map { longPrinter.string(from: $0) } ?? iso
    }

    static func dayMonth(_ iso: String) -> String {
        isoParser.date(from: iso).map { dayMonthPrinter.string(from: $0) } ?? iso
    }

    static func percent(_ value: Double) -> String {
        "\(Int((value * 100).rounded()))%"
    }

    static func euro(_ amount: Int) -> String {
        euroPrinter.string(from: NSNumber(value: amount)) ?? "\(amount) €"
    }
}
