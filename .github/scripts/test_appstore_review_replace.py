from copy import deepcopy
import unittest
from unittest.mock import Mock, patch

from requests import HTTPError

from appstore_review_api import API
from appstore_review_replace import replace_review


def resource(kind, identifier, attributes=(), relationships=()):
    return {"type": kind, "id": identifier, "attributes": dict(attributes), "relationships": dict(relationships)}


class ReviewReplacementTests(unittest.TestCase):
    def setUp(self):
        self.elapsed, self.cancelled, self.stalled, self.http_failure, self.complete_after = 0, False, False, None, 0
        self.invalidate_replacement = False
        self.cancelled_state = ""
        self.documents = {
            "/apps": {"data": [resource("apps", "app", {"bundleId": "soli.Machtblick"})]},
            "/apps/app/appStoreVersions": {"data": [resource("appStoreVersions", "version", {
                "versionString": "1.5", "platform": "IOS", "appStoreState": "WAITING_FOR_REVIEW",
            }, {"build": {"data": {"type": "builds", "id": "old"}}})], "included": [
                resource("builds", "old", {"version": "46", "processingState": "VALID"}),
            ]},
            "/builds": {"data": [resource("builds", "new", {"version": "47", "processingState": "VALID"}, {
                "preReleaseVersion": {"data": {"type": "preReleaseVersions", "id": "prerelease"}},
            })], "included": [resource("preReleaseVersions", "prerelease", {"version": "1.5", "platform": "IOS"})]},
            "/apps/app/reviewSubmissions": {"data": [resource("reviewSubmissions", "review", {
                "state": "WAITING_FOR_REVIEW", "platform": "IOS",
            }, {"appStoreVersionForReview": {"data": {"type": "appStoreVersions", "id": "version"}}})]},
            "/reviewSubmissions/review/items": {"data": [resource("reviewSubmissionItems", "item", (), {
                "appStoreVersion": {"data": {"type": "appStoreVersions", "id": "version"}},
            })]},
        }
        self.documents["/appStoreVersions/version"] = {
            "data": deepcopy(self.documents["/apps/app/appStoreVersions"]["data"][0]),
            "included": deepcopy(self.documents["/apps/app/appStoreVersions"]["included"]),
        }
        self.documents["/reviewSubmissions/review"] = {"data": deepcopy(self.documents["/apps/app/reviewSubmissions"]["data"][0])}
        for target, options in (
            ("appstore_review_api.headers", {"return_value": {"Authorization": "fixture"}}),
            ("appstore_review_replace.headers", {"return_value": {"Authorization": "fixture"}}),
            ("appstore_review_replace.time.monotonic", {"side_effect": lambda: self.elapsed}),
            ("appstore_review_replace.time.sleep", {"side_effect": self.sleep}),
        ):
            patcher = patch(target, **options)
            patcher.start()
            self.addCleanup(patcher.stop)
        self.get_request = patch("appstore_review_api.requests.get", side_effect=self.get).start()
        self.cancel_request = patch("appstore_review_replace.requests.patch", side_effect=self.cancel).start()
        self.addCleanup(patch.stopall)

    def sleep(self, duration):
        self.elapsed += duration

    def get(self, url, **kwargs):
        self.assertEqual(kwargs["timeout"], 30)
        body = deepcopy(self.documents[url.removeprefix(API)])
        if self.invalidate_replacement and url == f"{API}/builds":
            self.documents["/builds"]["data"][0]["attributes"]["processingState"] = "INVALID"
        if self.cancelled and not self.stalled and self.elapsed >= self.complete_after and url == f"{API}/appStoreVersions/version":
            body["data"]["attributes"]["appStoreState"] = "DEVELOPER_REJECTED"
        if self.cancelled and url == f"{API}/reviewSubmissions/review":
            body["data"]["attributes"]["state"] = self.cancelled_state or (
                "COMPLETE" if not self.stalled and self.elapsed >= self.complete_after else "CANCELING"
            )
        return Mock(json=Mock(return_value=body), raise_for_status=Mock(side_effect=HTTPError() if url == self.http_failure else None))

    def cancel(self, url, **kwargs):
        self.assertEqual(url, f"{API}/reviewSubmissions/review")
        self.cancelled = True
        return Mock(raise_for_status=Mock())

    def test_cancels_only_exact_review_after_preflight(self):
        self.complete_after = 20
        self.assertEqual(replace_review("1.5", "46", "47"), "version")
        self.assertEqual(self.elapsed, 20)
        self.cancel_request.assert_called_once_with(
            f"{API}/reviewSubmissions/review", headers={"Authorization": "fixture", "Content-Type": "application/json"},
            json={"data": {"type": "reviewSubmissions", "id": "review", "attributes": {"canceled": True}}}, timeout=30,
        )
        self.assertEqual(sum(call.args[0] == f"{API}/builds" for call in self.get_request.call_args_list), 2)

    def test_input_validation(self):
        for args in (("", "46", "47"), ("1.5", "old", "47"), ("1.5", "46", "new"), ("1.5", "46", "46"), ("1.5", "46", "45")):
            with self.subTest(args=args), self.assertRaises(AssertionError):
                replace_review(*args)
        self.get_request.assert_not_called()
        self.cancel_request.assert_not_called()

    def test_mismatches_and_races_never_cancel(self):
        original = deepcopy(self.documents)
        for path, location, value in (
            ("/apps", ("data", 0, "attributes", "bundleId"), "other.app"),
            ("/apps/app/appStoreVersions", ("data", 0, "attributes", "versionString"), "1.6"),
            ("/apps/app/appStoreVersions", ("included", 0, "attributes", "version"), "45"),
            ("/apps/app/appStoreVersions", ("data", 0, "attributes", "appStoreState"), "READY_FOR_SALE"),
            ("/apps/app/appStoreVersions", ("data", 0, "attributes", "appStoreState"), "PENDING_APPLE_RELEASE"),
            ("/builds", ("data", 0, "attributes", "processingState"), "INVALID"),
            ("/builds", ("data", 0, "attributes", "version"), "48"),
            ("/builds", ("included", 0, "attributes", "version"), "1.6"),
            ("/builds", ("included", 0, "attributes", "platform"), "MAC_OS"),
            ("/apps/app/reviewSubmissions", ("data", 0, "relationships", "appStoreVersionForReview", "data", "id"), "other"),
            ("/reviewSubmissions/review/items", ("data", 0, "relationships", "appStoreVersion", "data", "id"), "other"),
            ("/reviewSubmissions/review/items", ("data",), original["/reviewSubmissions/review/items"]["data"] * 2),
            ("/reviewSubmissions/review/items", ("data", 0, "relationships", "appEvent"), {"data": {"type": "appEvents", "id": "other"}}),
            ("/appStoreVersions/version", ("data", "attributes", "appStoreState"), "READY_FOR_SALE"),
            ("/appStoreVersions/version", ("included", 0, "attributes", "version"), "45"),
            ("/reviewSubmissions/review", ("data", "attributes", "state"), "COMPLETE"),
            ("/reviewSubmissions/review", ("data", "attributes", "state"), "READY_FOR_REVIEW"),
            ("/reviewSubmissions/review", ("data", "relationships", "appStoreVersionForReview", "data", "id"), "other"),
        ):
            with self.subTest(path=path, location=location):
                self.documents = deepcopy(original)
                target = self.documents[path]
                for key in location[:-1]:
                    target = target[key]
                target[location[-1]] = value
                with self.assertRaises(AssertionError):
                    replace_review("1.5", "46", "47")
                self.cancel_request.assert_not_called()

    def test_pagination_for_every_collection(self):
        original = deepcopy(self.documents)
        for path in ("/apps", "/apps/app/appStoreVersions", "/builds", "/apps/app/reviewSubmissions", "/reviewSubmissions/review/items"):
            with self.subTest(path=path):
                self.documents, self.cancelled = deepcopy(original), False
                self.documents["/next-page"] = deepcopy(self.documents[path])
                self.documents[path] = {"data": [], "links": {"next": f"{API}/next-page"}}
                self.assertEqual(replace_review("1.5", "46", "47"), "version")

    def test_already_rejected_resumes_only_after_new_build_validation(self):
        self.documents["/apps/app/appStoreVersions"]["data"][0]["attributes"]["appStoreState"] = "DEVELOPER_REJECTED"
        self.assertEqual(replace_review("1.5", "46", "47"), "version")
        self.cancel_request.assert_not_called()
        self.documents["/builds"]["data"][0]["attributes"]["processingState"] = "INVALID"
        with self.assertRaises(AssertionError):
            replace_review("1.5", "46", "47")
        self.cancel_request.assert_not_called()

    def test_additional_review_item_on_another_page_never_cancels(self):
        self.documents["/next-page"] = deepcopy(self.documents["/reviewSubmissions/review/items"])
        self.documents["/reviewSubmissions/review/items"]["links"] = {"next": f"{API}/next-page"}
        with self.assertRaises(AssertionError):
            replace_review("1.5", "46", "47")
        self.cancel_request.assert_not_called()

    def test_replacement_processing_race_never_cancels(self):
        self.invalidate_replacement = True
        with self.assertRaises(AssertionError):
            replace_review("1.5", "46", "47")
        self.cancel_request.assert_not_called()

    def test_http_error_does_not_cancel(self):
        self.http_failure = f"{API}/reviewSubmissions/review"
        with self.assertRaises(HTTPError):
            replace_review("1.5", "46", "47")
        self.cancel_request.assert_not_called()

    def test_cancellation_has_a_deadline(self):
        self.stalled = True
        self.cancelled_state = "READY_FOR_REVIEW"
        with self.assertRaisesRegex(AssertionError, "600 seconds"):
            replace_review("1.5", "46", "47")
        self.cancel_request.assert_called_once()
        self.assertEqual(self.elapsed, 600)

    def test_ready_review_waits_for_rejected_version(self):
        self.cancelled_state, self.complete_after = "READY_FOR_REVIEW", 20
        self.assertEqual(replace_review("1.5", "46", "47"), "version")
        self.assertEqual(self.elapsed, 20)
        self.cancel_request.assert_called_once()


if __name__ == "__main__":
    unittest.main()
