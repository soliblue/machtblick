import XCTest

final class MotionParityUITests: XCTestCase {
    @MainActor
    func testLinkedVoteResultsDetailsAndSpeeches() {
        continueAfterFailure = false
        let vote = "2025-12-05-984-gesetzentwurf-zur-modernisierung-des-wehrdienstes"
        for language in ["de", "en"] {
            let session = NativeParitySession(scenario: "linkedMotion", language: language)
            XCTAssertEqual(session.app.buttons.matching(identifier: "motion-detail-tabs").count, 3)
            session.scrollTo(
                session.app.descendants(matching: .any)["vote-result-cell-\(vote)-total-yes"])
            session.assertCell(vote: vote, column: "yes", value: "323")
            session.assertCell(vote: vote, column: "no", value: "272")
            session.assertCell(vote: vote, column: "abstain", value: "1")
            session.assertCell(vote: vote, column: "absent", value: "34")
            session.assertCell(vote: vote, row: "cdu-csu", column: "yes", value: "206")
            session.revealResultColumn(vote: vote, column: "absent")
            session.capture("\(language)-motion-results", test: self)

            session.scrollToTop(session.motionTab("Details"))
            session.motionTab("Details").tap()
            XCTAssertTrue(
                session.app.descendants(matching: .any)["motion-details"]
                    .waitForExistence(timeout: 5))
            XCTAssertTrue(
                session.app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "21/1853"))
                    .firstMatch.exists)
            XCTAssertTrue(
                session.app.staticTexts.matching(
                    NSPredicate(format: "label ==[c] %@", language == "de" ? "Verfahren" : "Procedure"))
                    .firstMatch.waitForExistence(timeout: 5))
            session.capture("\(language)-motion-details", test: self)

            session.scrollToTop(session.motionTab(language == "de" ? "Reden" : "Speeches"))
            session.motionTab(language == "de" ? "Reden" : "Speeches").tap()
            XCTAssertTrue(
                session.app.descendants(matching: .any)["motion-speeches"]
                    .waitForExistence(timeout: 5))
            XCTAssertTrue(
                session.app.staticTexts
                    .matching(NSPredicate(format: "label ENDSWITH %@", "· 5")).firstMatch.exists)
            session.scrollTo(
                session.app.staticTexts
                    .matching(NSPredicate(format: "label ENDSWITH %@", "· 5")).firstMatch)
            session.capture("\(language)-motion-debate-summary", test: self)
            session.scrollTo(
                session.app.staticTexts.matching(
                    NSPredicate(
                        format: "label ==[c] %@",
                        language == "de" ? "Verlauf der Debatte" : "Debate timeline")).firstMatch)
            session.scrollTo(session.app.staticTexts["Siemtje Möller"].firstMatch)
            session.capture("\(language)-motion-speeches", test: self)

            session.scrollToTop(session.motionTab(language == "de" ? "Ergebnis" : "Result"))
            session.motionTab(language == "de" ? "Ergebnis" : "Result").tap()
            session.assertCell(vote: vote, column: "yes", value: "323")
            XCTAssertFalse(session.app.descendants(matching: .any)["motion-speeches"].exists)
            session.app.terminate()
        }
    }
}
