import XCTest

@MainActor
struct NativeParitySession {
    let app = XCUIApplication()

    init(scenario: String, language: String) {
        app.launchArguments = [
            "-AppleLanguages", "(\(language))",
            "-AppleLocale", language == "de" ? "de_DE" : "en_US",
            "-AppStoreScreenshot", scenario,
            "-AppStoreScreenshotLanguage", language,
            "-AppStoreScreenshotTheme", language == "de" ? "light" : "dark",
        ]
        app.launch()
        XCTAssertTrue(
            app.descendants(matching: .any)[
                scenario == "linkedMotion"
                    ? "motion-detail-ready" : "app-store-screenshot-\(scenario)-ready"
            ].waitForExistence(timeout: 45))
    }

    func scrollTo(_ element: XCUIElement) {
        XCTAssertTrue(element.waitForExistence(timeout: 10))
        for _ in 0..<8 where !element.isHittable {
            element.frame.midY < app.frame.midY
                ? app.scrollViews.firstMatch.swipeDown() : app.scrollViews.firstMatch.swipeUp()
        }
        XCTAssertTrue(element.isHittable)
    }

    func scrollToTop(_ element: XCUIElement) {
        XCTAssertTrue(element.waitForExistence(timeout: 5))
        for _ in 0..<8 where !element.isHittable {
            app.scrollViews.firstMatch.swipeDown()
        }
        XCTAssertTrue(element.isHittable)
    }

    func motionTab(_ label: String) -> XCUIElement {
        app.buttons.matching(
            NSPredicate(format: "identifier == %@ AND label == %@", "motion-detail-tabs", label))
            .firstMatch
    }

    func assertCell(vote: String, row: String = "total", column: String, value: String) {
        XCTAssertTrue(
            app.descendants(matching: .any)["vote-result-cell-\(vote)-\(row)-\(column)"]
                .waitForExistence(timeout: 10))
        XCTAssertEqual(
            app.descendants(matching: .any)["vote-result-cell-\(vote)-\(row)-\(column)"].value
                as? String,
            value)
    }

    func revealResultColumn(vote: String, column: String) {
        let cell = app.descendants(matching: .any)["vote-result-cell-\(vote)-total-\(column)"]
        let y = app.descendants(matching: .any)["vote-result-cell-\(vote)-total-yes"].frame.midY
            / app.frame.height
        for _ in 0..<3 where !cell.isHittable {
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: y))
                .press(
                    forDuration: 0.05,
                    thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.15, dy: y)))
        }
        XCTAssertTrue(cell.isHittable)
    }

    func capture(_ name: String, test: XCTestCase) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        test.add(attachment)
    }
}
