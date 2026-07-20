import os

import requests

from asc_api import headers

API = "https://api.appstoreconnect.apple.com/v1"
SESSION = requests.Session()


def all_data(url, params=None):
    data = []
    while url:
        response = SESSION.get(url, headers=headers(), params=params, timeout=30)
        response.raise_for_status()
        body = response.json()
        data.extend(body.get("data", []))
        url = body.get("links", {}).get("next")
        params = None
    return data


app = all_data(
    f"{API}/apps",
    {"filter[bundleId]": "soli.Machtblick", "fields[apps]": "bundleId,name", "limit": 2},
)
assert len(app) == 1, f"Expected one Machtblick app, found {len(app)}."
versions = [
    version
    for version in all_data(
        f"{API}/apps/{app[0]['id']}/appStoreVersions",
        {
            "fields[appStoreVersions]": "versionString,platform,appStoreState,releaseType",
            "limit": 200,
        },
    )
    if version["attributes"]["versionString"] == os.environ["RELEASE_VERSION"]
    and version["attributes"]["platform"] == "IOS"
]
assert len(versions) <= 1, f"Expected at most one iOS version, found {len(versions)}."
if versions:
    response = SESSION.patch(
        f"{API}/appStoreVersions/{versions[0]['id']}",
        headers={**headers(), "Content-Type": "application/json"},
        json={
            "data": {
                "type": "appStoreVersions",
                "id": versions[0]["id"],
                "attributes": {"releaseType": "AFTER_APPROVAL"},
            }
        },
        timeout=30,
    )
    response.raise_for_status()
    assert response.json()["data"]["attributes"]["releaseType"] == "AFTER_APPROVAL"
    print(f"App Store version {os.environ['RELEASE_VERSION']} will release automatically after approval.")
else:
    response = SESSION.post(
        f"{API}/appStoreVersions",
        headers={**headers(), "Content-Type": "application/json"},
        json={
            "data": {
                "type": "appStoreVersions",
                "attributes": {
                    "platform": "IOS",
                    "versionString": os.environ["RELEASE_VERSION"],
                    "releaseType": "AFTER_APPROVAL",
                },
                "relationships": {
                    "app": {"data": {"type": "apps", "id": app[0]["id"]}}
                },
            }
        },
        timeout=30,
    )
    response.raise_for_status()
    print(f"Created App Store version {os.environ['RELEASE_VERSION']} with automatic release.")
