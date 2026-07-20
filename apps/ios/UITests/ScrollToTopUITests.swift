import XCTest

final class ScrollToTopUITests: XCTestCase {
    @MainActor
    func testBrandScrollsVotesToTop() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = [
            "-AppleLanguages", "(en)",
            "-AppleLocale", "en_GB",
            "-AppStoreScreenshot", "currentDecision",
            "-AppStoreScreenshotLanguage", "en",
        ]
        app.launch()
        XCTAssertTrue(
            app.descendants(matching: .any)["app-store-screenshot-currentDecision-ready"]
                .waitForExistence(timeout: 30))

        let firstVote = app.buttons.matching(
            NSPredicate(format: "identifier BEGINSWITH 'vote-'"))
            .element(boundBy: 0)
        XCTAssertTrue(firstVote.isHittable)
        app.scrollViews.firstMatch.swipeUp()
        XCTAssertEqual(
            XCTWaiter.wait(
                for: [
                    XCTNSPredicateExpectation(
                        predicate: NSPredicate(format: "isHittable == false"),
                        object: firstVote)
                ],
                timeout: 5),
            .completed)

        app.buttons["scroll-to-top"].tap()
        XCTAssertEqual(
            XCTWaiter.wait(
                for: [
                    XCTNSPredicateExpectation(
                        predicate: NSPredicate(format: "isHittable == true"),
                        object: firstVote)
                ],
                timeout: 5),
            .completed)
    }
}
