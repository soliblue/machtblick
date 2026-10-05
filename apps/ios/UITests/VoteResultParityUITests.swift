import XCTest

final class VoteResultParityUITests: XCTestCase {
    @MainActor
    func testRollCallTotalsOrderingAndPartyNavigation() {
        continueAfterFailure = false
        let vote = "2025-12-05-984-gesetzentwurf-zur-modernisierung-des-wehrdienstes"
        for language in ["de", "en"] {
            let session = NativeParitySession(scenario: "rollCallResults", language: language)
            session.scrollTo(
                session.app.descendants(matching: .any)["vote-result-cell-\(vote)-total-yes"])
            session.assertCell(vote: vote, column: "yes", value: "323")
            session.assertCell(vote: vote, column: "no", value: "272")
            session.assertCell(vote: vote, column: "abstain", value: "1")
            session.assertCell(vote: vote, column: "absent", value: "34")
            session.assertCell(vote: vote, row: "cdu-csu", column: "no", value: "0")
            XCTAssertFalse(
                session.app.descendants(matching: .any)["vote-result-cell-\(vote)-total-unknown"]
                    .exists)
            session.scrollTo(
                session.app.descendants(matching: .any)["vote-result-cell-\(vote)-fraktionslos-yes"])
            XCTAssertTrue(
                session.app.descendants(matching: .any)["vote-result-cell-\(vote)-total-yes"].isHittable)
            for pair in zip(
                ["total", "cdu-csu", "afd", "spd", "gruene", "linke"],
                ["cdu-csu", "afd", "spd", "gruene", "linke", "fraktionslos"])
            {
                XCTAssertLessThan(
                    session.app.descendants(matching: .any)["vote-result-cell-\(vote)-\(pair.0)-yes"]
                        .frame.minY,
                    session.app.descendants(matching: .any)["vote-result-cell-\(vote)-\(pair.1)-yes"]
                        .frame.minY)
            }
            session.assertResultTableWidth(vote: vote, column: "absent")
            session.capture("\(language)-rollcall-results", test: self)
            session.scrollTo(
                session.app.buttons["vote-result-party-\(vote)-cdu-csu"])
            session.app.buttons["vote-result-party-\(vote)-cdu-csu"].tap()
            XCTAssertTrue(
                session.app.staticTexts.matching(
                    NSPredicate(
                        format: "label ==[c] %@",
                        language == "de" ? "Geschlossenheit" : "Cohesion"))
                    .firstMatch.waitForExistence(timeout: 30))
            XCTAssertTrue(session.app.staticTexts["CDU/CSU"].exists)
            session.capture("\(language)-result-party-navigation", test: self)
            session.app.terminate()
        }
    }

    @MainActor
    func testShowOfHandsDistinguishesZeroAbsenceAndUnknownSeats() {
        continueAfterFailure = false
        let vote = "pp21-81-1-modernisierung-der-okodesign-und-energieverbrauchskennzeichnungsregeln"
        for language in ["de", "en"] {
            let session = NativeParitySession(scenario: "handzeichenResults", language: language)
            session.scrollTo(
                session.app.descendants(matching: .any)["vote-result-cell-\(vote)-total-yes"])
            session.assertCell(vote: vote, column: "yes", value: "328")
            session.assertCell(vote: vote, column: "no", value: "299")
            session.assertCell(vote: vote, column: "abstain", value: "0")
            session.assertCell(vote: vote, column: "unknown", value: "3")
            session.assertCell(vote: vote, row: "cdu-csu", column: "no", value: "0")
            session.assertCell(
                vote: vote, column: "absent",
                value: language == "de" ? "Nicht erfasst" : "Not recorded")
            session.assertCell(
                vote: vote, row: "cdu-csu", column: "absent",
                value: language == "de" ? "Nicht erfasst" : "Not recorded")
            session.capture("\(language)-handzeichen-results", test: self)
            session.revealResultColumn(vote: vote, column: "unknown")
            session.assertResultTableWidth(vote: vote, column: "unknown")
            session.capture("\(language)-handzeichen-unknown-seats", test: self)
            session.app.terminate()
        }
    }
}
