import os
from pathlib import Path

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
    f"{API}/builds",
    headers=headers(),
    params={
        "filter[app]": apps[0]["id"],
        "filter[version]": os.environ["TESTFLIGHT_BUILD_NUMBER"],
        "include": "preReleaseVersion",
        "fields[builds]": "version,processingState,preReleaseVersion",
        "fields[preReleaseVersions]": "version,platform",
        "limit": 2,
    },
    timeout=30,
)
response.raise_for_status()
builds = response.json()["data"]
assert len(builds) == 1
assert builds[0]["attributes"]["processingState"] == "VALID"
prerelease = next(
    item["attributes"]
    for item in response.json()["included"]
    if item["id"] == builds[0]["relationships"]["preReleaseVersion"]["data"]["id"]
)
version = next(
    line.removeprefix("MARKETING_VERSION = ")
    for line in Path("apps/ios/Config/Version.xcconfig").read_text().splitlines()
    if line.startswith("MARKETING_VERSION = ")
)
assert prerelease == {"version": version, "platform": "IOS"}
print(f"Machtblick {version} build {builds[0]['attributes']['version']} is VALID for App Store submission.")
with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
    summary.write(f"Machtblick {version} build {builds[0]['attributes']['version']} is processed and ready for App Store submission.\n")
