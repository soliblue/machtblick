import XCTest

final class ThemePreferenceUITests: XCTestCase {
    @MainActor
    func testThemeSwitchingAndPersistence() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(en)", "-AppleLocale", "en_GB"]
        app.launch()
        openMore(app)
        assertTheme(app, selection: "System", resolved: "dark", screenshot: "system-dark")

        selectTheme(app, option: "Light", resolved: "light")
        assertTheme(app, selection: "Light", resolved: "light", screenshot: "light-immediate")
        relaunch(app)
        assertTheme(app, selection: "Light", resolved: "light", screenshot: "light-relaunch")

        selectTheme(app, option: "Dark", resolved: "dark")
        assertTheme(app, selection: "Dark", resolved: "dark", screenshot: "dark-immediate")
        relaunch(app)
        assertTheme(app, selection: "Dark", resolved: "dark", screenshot: "dark-relaunch")

        selectTheme(app, option: "System", resolved: "dark")
        assertTheme(app, selection: "System", resolved: "dark", screenshot: "system-immediate")
        relaunch(app)
        assertTheme(app, selection: "System", resolved: "dark", screenshot: "system-relaunch")
    }

    @MainActor
    private func openMore(_ app: XCUIApplication) {
        let more = app.tabBars.buttons["More"]
        XCTAssertTrue(more.waitForExistence(timeout: 10))
        more.tap()
        XCTAssertTrue(app.descendants(matching: .any)["appearance-picker"].waitForExistence(timeout: 5))
    }

    @MainActor
    private func selectTheme(_ app: XCUIApplication, option: String, resolved: String) {
        app.descendants(matching: .any)["appearance-picker"].tap()
        let choice = app.buttons[option]
        XCTAssertTrue(choice.waitForExistence(timeout: 5))
        choice.tap()
        waitForResolvedTheme(app, resolved)
    }

    @MainActor
    private func assertTheme(
        _ app: XCUIApplication,
        selection: String,
        resolved: String,
        screenshot: String
    ) {
        waitForResolvedTheme(app, resolved)
        XCTAssertEqual(
            app.descendants(matching: .any)["appearance-picker"].value as? String,
            selection)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = screenshot
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    @MainActor
    private func waitForResolvedTheme(_ app: XCUIApplication, _ resolved: String) {
        let marker = app.staticTexts["resolved-theme"]
        XCTAssertTrue(marker.waitForExistence(timeout: 5))
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label == %@", resolved),
            object: marker)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: 5), .completed)
    }

    @MainActor
    private func relaunch(_ app: XCUIApplication) {
        app.terminate()
        app.launch()
        openMore(app)
    }
}
