import os
import time

import requests

from asc_api import headers
from appstore_review_api import (
    ACTIVE, API, read, read_all, replacement_build,
    validate_items, validate_submission, validate_version,
)


def replace_review(version, previous_build, replacement):
    assert version.strip() and previous_build.isdigit() and replacement.isdigit()
    assert int(replacement) > int(previous_build)
    apps = read_all(
        f"{API}/apps",
        {"filter[bundleId]": "soli.Machtblick", "fields[apps]": "bundleId", "limit": 2},
    )["data"]
    assert len(apps) == 1 and apps[0]["type"] == "apps"
    assert apps[0]["attributes"]["bundleId"] == "soli.Machtblick"
    versions = read_all(
        f"{API}/apps/{apps[0]['id']}/appStoreVersions",
        {"include": "build", "limit": 200},
    )
    matching = [
        item for item in versions["data"]
        if item["attributes"]["versionString"] == version
        and item["attributes"]["platform"] == "IOS"
    ]
    assert len(matching) == 1
    target = matching[0]
    validate_version(target, versions["included"], version, previous_build, (*ACTIVE, "DEVELOPER_REJECTED"))
    replacement_id = replacement_build(apps[0]["id"], version, replacement)
    if target["attributes"]["appStoreState"] in ACTIVE:
        submissions = read_all(
            f"{API}/apps/{apps[0]['id']}/reviewSubmissions",
            {"filter[platform]": "IOS", "include": "appStoreVersionForReview", "limit": 200},
        )["data"]
        matching = [
            item for item in submissions
            if item["attributes"]["state"] in ACTIVE
            and item["relationships"].get("appStoreVersionForReview", {}).get("data")
            == {"type": "appStoreVersions", "id": target["id"]}
        ]
        assert len(matching) == 1
        submission = matching[0]
        validate_submission(submission, target["id"])
        validate_items(submission["id"], target["id"])
        assert replacement_build(apps[0]["id"], version, replacement) == replacement_id
        current = read(f"{API}/appStoreVersions/{target['id']}", {"include": "build"})
        validate_version(current["data"], current["included"], version, previous_build, ACTIVE)
        assert current["data"]["id"] == target["id"]
        assert current["data"]["relationships"]["build"]["data"] == target["relationships"]["build"]["data"]
        current_submission = read(
            f"{API}/reviewSubmissions/{submission['id']}", {"include": "appStoreVersionForReview"},
        )["data"]
        assert current_submission["id"] == submission["id"]
        validate_submission(current_submission, target["id"])
        validate_items(submission["id"], target["id"])
        response = requests.patch(
            f"{API}/reviewSubmissions/{submission['id']}",
            headers={**headers(), "Content-Type": "application/json"},
            json={"data": {"type": "reviewSubmissions", "id": submission["id"], "attributes": {"canceled": True}}},
            timeout=30,
        )
        response.raise_for_status()
        deadline = time.monotonic() + 600
        states = (target["attributes"]["appStoreState"], current_submission["attributes"]["state"])
        print(f"Cancelling Machtblick {version} build {previous_build}: {states}.", flush=True)
        while target["attributes"]["appStoreState"] in ACTIVE and time.monotonic() < deadline:
            current = read(f"{API}/appStoreVersions/{target['id']}", {"include": "build"})
            validate_version(current["data"], current["included"], version, previous_build, (*ACTIVE, "DEVELOPER_REJECTED"))
            assert current["data"]["id"] == target["id"]
            assert current["data"]["relationships"]["build"]["data"] == target["relationships"]["build"]["data"]
            target = current["data"]
            current_submission = read(f"{API}/reviewSubmissions/{submission['id']}")["data"]
            assert current_submission["id"] == submission["id"] and current_submission["type"] == "reviewSubmissions"
            assert current_submission["attributes"]["platform"] == "IOS"
            assert current_submission["attributes"]["state"] in (*ACTIVE, "CANCELING", "COMPLETING", "COMPLETE", "READY_FOR_REVIEW")
            if states != (target["attributes"]["appStoreState"], current_submission["attributes"]["state"]):
                states = (target["attributes"]["appStoreState"], current_submission["attributes"]["state"])
                print(f"App Review transition: {states}.", flush=True)
            if target["attributes"]["appStoreState"] in ACTIVE:
                time.sleep(min(10, max(0, deadline - time.monotonic())))
        assert target["attributes"]["appStoreState"] == "DEVELOPER_REJECTED", "Cancellation did not complete within 600 seconds."
    print(f"Machtblick {version} build {previous_build} is DEVELOPER_REJECTED; processed build {replacement} can replace it.", flush=True)
    return target["id"]


if __name__ == "__main__":
    replace_review(
        os.environ["RELEASE_VERSION"],
        os.environ["REPLACED_BUILD_NUMBER"],
        os.environ["RELEASE_BUILD_NUMBER"],
    )
