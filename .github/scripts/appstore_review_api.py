import requests

from asc_api import headers

API = "https://api.appstoreconnect.apple.com/v1"
ACTIVE = ("WAITING_FOR_REVIEW", "IN_REVIEW")


def read(url, params=None):
    response = requests.get(url, headers=headers(), params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def read_all(url, params=None):
    data, included, visited = [], [], set()
    while url:
        assert url.startswith(f"{API}/") and url not in visited
        visited.add(url)
        body = read(url, params)
        data.extend(body["data"])
        included.extend(body.get("included", []))
        url = body.get("links", {}).get("next")
        params = None
    return {"data": data, "included": included}


def validate_version(version, included, release_version, previous_build, states):
    assert version["type"] == "appStoreVersions"
    assert version["attributes"]["versionString"] == release_version
    assert version["attributes"]["platform"] == "IOS"
    assert version["attributes"]["appStoreState"] in states
    assert version["relationships"]["build"]["data"]["type"] == "builds"
    build = next(
        item for item in included
        if item["type"] == "builds"
        and item["id"] == version["relationships"]["build"]["data"]["id"]
    )
    assert build["attributes"]["version"] == previous_build
    assert build["attributes"]["processingState"] == "VALID"


def replacement_build(app_id, release_version, build_number):
    body = read_all(
        f"{API}/builds",
        {
            "filter[app]": app_id,
            "filter[version]": build_number,
            "include": "preReleaseVersion",
            "fields[builds]": "version,processingState,preReleaseVersion",
            "fields[preReleaseVersions]": "version,platform",
            "limit": 200,
        },
    )
    assert len(body["data"]) == 1
    assert body["data"][0]["type"] == "builds"
    assert body["data"][0]["attributes"]["version"] == build_number
    assert body["data"][0]["attributes"]["processingState"] == "VALID"
    assert body["data"][0]["relationships"]["preReleaseVersion"]["data"]["type"] == "preReleaseVersions"
    prerelease = next(
        item for item in body["included"]
        if item["type"] == "preReleaseVersions"
        and item["id"] == body["data"][0]["relationships"]["preReleaseVersion"]["data"]["id"]
    )
    assert prerelease["attributes"]["version"] == release_version
    assert prerelease["attributes"]["platform"] == "IOS"
    return body["data"][0]["id"]


def validate_submission(submission, version_id):
    assert submission["type"] == "reviewSubmissions"
    assert submission["attributes"]["platform"] == "IOS"
    assert submission["attributes"]["state"] in ACTIVE
    assert submission["relationships"]["appStoreVersionForReview"]["data"] == {
        "type": "appStoreVersions", "id": version_id,
    }


def validate_items(submission_id, version_id):
    items = read_all(
        f"{API}/reviewSubmissions/{submission_id}/items",
        {"include": "appStoreVersion", "limit": 200},
    )["data"]
    assert len(items) == 1
    assert items[0]["type"] == "reviewSubmissionItems"
    assert items[0]["relationships"]["appStoreVersion"]["data"] == {
        "type": "appStoreVersions", "id": version_id,
    }
    assert all(
        name == "appStoreVersion" or not relationship.get("data")
        for name, relationship in items[0]["relationships"].items()
    )
