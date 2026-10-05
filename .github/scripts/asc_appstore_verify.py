import os

import requests

from asc_api import headers

API = "https://api.appstoreconnect.apple.com/v1"
response = requests.get(
    f"{API}/apps",
    headers=headers(),
    params={"filter[bundleId]": "soli.Machtblick", "limit": 2},
    timeout=30,
)
response.raise_for_status()
apps = response.json()["data"]
assert len(apps) == 1
response = requests.get(
    f"{API}/apps/{apps[0]['id']}/appStoreVersions",
    headers=headers(),
    params={
        "include": "build,appStoreVersionLocalizations",
        "fields[appStoreVersions]": "versionString,platform,appStoreState,releaseType,build,appStoreVersionLocalizations",
        "fields[builds]": "version,processingState",
        "fields[appStoreVersionLocalizations]": "locale,whatsNew",
        "limit": 200,
    },
    timeout=30,
)
response.raise_for_status()
versions = [
    item for item in response.json()["data"]
    if item["attributes"]["versionString"] == os.environ["RELEASE_VERSION"]
    and item["attributes"]["platform"] == "IOS"
]
assert len(versions) == 1
version = versions[0]
assert version["attributes"]["releaseType"] == "AFTER_APPROVAL"
assert version["attributes"]["appStoreState"] in (
    "WAITING_FOR_REVIEW", "IN_REVIEW", "PENDING_APPLE_RELEASE", "READY_FOR_SALE"
)
build = next(
    item for item in response.json()["included"]
    if item["type"] == "builds"
    and item["id"] == version["relationships"]["build"]["data"]["id"]
)
assert build["attributes"]["version"] == os.environ["RELEASE_BUILD_NUMBER"]
assert build["attributes"]["processingState"] == "VALID"
for locale, notes in (("de-DE", "WHATS_NEW_DE"), ("en-US", "WHATS_NEW_EN")):
    assert any(
        item["type"] == "appStoreVersionLocalizations"
        and item["id"] in {
            localization["id"]
            for localization in version["relationships"]["appStoreVersionLocalizations"]["data"]
        }
        and item["attributes"]["locale"] == locale
        and item["attributes"]["whatsNew"].strip() == os.environ[notes].strip()
        for item in response.json()["included"]
    )
print(f"Verified Machtblick {os.environ['RELEASE_VERSION']} build {os.environ['RELEASE_BUILD_NUMBER']}: {version['attributes']['appStoreState']}, automatic release, German and English notes.")
with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
    summary.write(f"Verified App Store state: {version['attributes']['appStoreState']}. Attached build: {os.environ['RELEASE_BUILD_NUMBER']}. Automatic release and both localized notes confirmed.\n")
