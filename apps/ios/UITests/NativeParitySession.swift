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
        let viewport = app.scrollViews.matching(
            NSPredicate(
                format: "identifier == %@ OR identifier == %@",
                "vote-results-\(vote)", "motion-linked-vote-\(vote)"))
            .firstMatch
        let cell = app.descendants(matching: .any)["vote-result-cell-\(vote)-total-\(column)"]
        XCTAssertTrue(viewport.waitForExistence(timeout: 5))
        let y = (cell.frame.midY - viewport.frame.minY) / viewport.frame.height
        for _ in 0..<3 where !cell.isHittable || cell.frame.maxX > viewport.frame.maxX + 2 {
            viewport.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: y))
                .press(
                    forDuration: 0.05,
                    thenDragTo: viewport.coordinate(withNormalizedOffset: CGVector(dx: 0.15, dy: y)))
        }
        XCTContext.runActivity(named: "Result column geometry") { activity in
            let attachment = XCTAttachment(string: """
                viewport: \(viewport.frame)
                total: \(cell.frame)
                hittable: \(cell.isHittable)
                party: \(app.buttons["vote-result-party-\(vote)-cdu-csu"].frame)
                partyLast: \(app.descendants(matching: .any)["vote-result-cell-\(vote)-cdu-csu-\(column)"].frame)
                """)
            attachment.name = "result-geometry-\(vote)-\(column)"
            activity.add(attachment)
        }
        XCTAssertTrue(cell.isHittable)
        XCTAssertGreaterThanOrEqual(cell.frame.minX, viewport.frame.minX - 2)
        XCTAssertLessThanOrEqual(cell.frame.maxX, viewport.frame.maxX + 2)
    }

    func assertResultTableWidth(vote: String, column: String) {
        let viewport = app.scrollViews.matching(
            NSPredicate(
                format: "identifier == %@ OR identifier == %@",
                "vote-results-\(vote)", "motion-linked-vote-\(vote)"))
            .firstMatch
        let total = app.descendants(matching: .any)["vote-result-cell-\(vote)-total-\(column)"]
        let party = app.buttons["vote-result-party-\(vote)-cdu-csu"]
        let result = app.descendants(matching: .any)["vote-result-cell-\(vote)-cdu-csu-\(column)"]
        XCTAssertTrue(viewport.waitForExistence(timeout: 5))
        XCTAssertTrue(total.isHittable)
        XCTAssertGreaterThanOrEqual(total.frame.maxX, viewport.frame.maxX - 28)
        XCTAssertLessThanOrEqual(total.frame.maxX, viewport.frame.maxX + 2)
        XCTAssertGreaterThanOrEqual(result.frame.maxX, viewport.frame.maxX - 28)
        XCTAssertLessThanOrEqual(result.frame.maxX, viewport.frame.maxX + 2)
        XCTAssertGreaterThanOrEqual(
            result.frame.maxX - party.frame.minX,
            viewport.frame.width - 40)
    }

    func capture(_ name: String, test: XCTestCase) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        test.add(attachment)
    }
}
