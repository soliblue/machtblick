import XCTest

final class AppStoreScreenshotUITests: XCTestCase {
    @MainActor
    func testCaptureAppStoreScreenshots() {
        continueAfterFailure = false
        for locale in ScreenshotLocale.all {
            for scenario in Scenario.all {
                let app = XCUIApplication()
                app.launchArguments = [
                    "-AppleLanguages", "(\(locale.language))",
                    "-AppleLocale", locale.locale,
                    "-AppStoreScreenshot", scenario.id,
                    "-AppStoreScreenshotLanguage", locale.language,
                ]
                app.launch()
                XCTAssertTrue(
                    app.descendants(matching: .any)["app-store-screenshot-\(scenario.id)-ready"]
                        .waitForExistence(timeout: 30))
                for drag in scenario.drags {
                    app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: drag.0))
                        .press(
                            forDuration: 0.05,
                            thenDragTo: app.coordinate(
                                withNormalizedOffset: CGVector(dx: 0.5, dy: drag.1)))
                }
                Thread.sleep(forTimeInterval: 1)
                let attachment = XCTAttachment(screenshot: app.screenshot())
                attachment.name = "\(locale.id)--\(scenario.source)"
                attachment.lifetime = .keepAlways
                add(attachment)
                app.terminate()
            }
        }
    }
}

private struct ScreenshotLocale {
    let id: String
    let language: String
    let locale: String

    static let all = [
        ScreenshotLocale(id: "de-DE", language: "de", locale: "de_DE"),
        ScreenshotLocale(id: "en-US", language: "en", locale: "en_US"),
    ]
}

private struct Scenario {
    let id: String
    let source: String
    let drags: [(CGFloat, CGFloat)]

    static let all = [
        Scenario(id: "currentDecision", source: "iphone-aktuelle-abstimmung.png", drags: []),
        Scenario(id: "motionSummary", source: "iphone-antrag-zusammenfassung.png", drags: []),
        Scenario(
            id: "memberDebate",
            source: "iphone-mitgliederdebatte.png",
            drags: [(0.84, 0.35), (0.84, 0.35)]),
        Scenario(id: "memberVotes", source: "iphone-abgeordneten-stimmen.png", drags: []),
        Scenario(id: "partyComparison", source: "iphone-parteivergleich.png", drags: []),
    ]
}
