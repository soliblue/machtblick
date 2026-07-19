import os
import sys
import time
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from asc_api import headers

API = "https://api.appstoreconnect.apple.com/v1"
PUBLIC_LINK = "https://testflight.apple.com/join/r7RVrgtr"
APP_VERSION = next(
    line.removeprefix("MARKETING_VERSION = ")
    for line in Path("apps/ios/Config/Version.xcconfig").read_text(encoding="utf-8").splitlines()
    if line.startswith("MARKETING_VERSION = ")
)
SESSION = requests.Session()
SESSION.mount(
    "https://",
    HTTPAdapter(
        max_retries=Retry(
            total=5,
            connect=5,
            read=5,
            status=5,
            backoff_factor=2,
            backoff_max=30,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=("GET",),
            respect_retry_after_header=True,
        )
    ),
)


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

if sys.argv[1] == "prepare":
    groups = [
        group
        for group in all_data(
            f"{API}/apps/{app[0]['id']}/betaGroups",
            {
                "fields[betaGroups]": "name,isInternalGroup,publicLinkEnabled,publicLink",
                "limit": 200,
            },
        )
        if not group["attributes"]["isInternalGroup"]
        and group["attributes"]["publicLinkEnabled"]
        and (group["attributes"]["publicLink"] or "").rstrip("/") == PUBLIC_LINK
    ]
    assert len(groups) == 1, f"Expected one Machtblick public group, found {len(groups)}."
    with open(os.environ["GITHUB_ENV"], "a", encoding="utf-8") as env:
        env.write(f"TESTFLIGHT_PUBLIC_GROUP={groups[0]['attributes']['name']}\n")
        env.write(f"TESTFLIGHT_PUBLIC_GROUP_ID={groups[0]['id']}\n")
    print(f"Resolved public TestFlight group: {groups[0]['attributes']['name']}")

if sys.argv[1] == "activate":
    builds = all_data(
        f"{API}/builds",
        {
            "filter[app]": app[0]["id"],
            "filter[version]": os.environ["TESTFLIGHT_BUILD_NUMBER"],
            "fields[builds]": "version,processingState",
            "limit": 2,
        },
    )
    assert len(builds) == 1, f"Expected one build, found {len(builds)}."
    detail = SESSION.get(
        f"{API}/builds/{builds[0]['id']}/buildBetaDetail",
        headers=headers(),
        params={"fields[buildBetaDetails]": "externalBuildState"},
        timeout=30,
    )
    detail.raise_for_status()
    external = detail.json()["data"]["attributes"]["externalBuildState"]
    assert builds[0]["attributes"]["processingState"] == "VALID"
    assert builds[0]["id"] in {
        item["id"]
        for item in all_data(
            f"{API}/betaGroups/{os.environ['TESTFLIGHT_PUBLIC_GROUP_ID']}/relationships/builds",
            {"limit": 200},
        )
    }
    if external == "IN_BETA_TESTING":
        print(f"Build {os.environ['TESTFLIGHT_BUILD_NUMBER']} is already in external testing.")
    else:
        assert external in ("BETA_APPROVED", "WAITING_FOR_BETA_REVIEW", "IN_BETA_REVIEW"), f"Observed external build state {external}."
        notification = SESSION.post(
            f"{API}/buildBetaNotifications",
            headers={**headers(), "Content-Type": "application/json"},
            json={
                "data": {
                    "type": "buildBetaNotifications",
                    "relationships": {
                        "build": {"data": {"type": "builds", "id": builds[0]["id"]}}
                    },
                }
            },
            timeout=30,
        )
        notification.raise_for_status()
        print(f"Activated external testing for build {os.environ['TESTFLIGHT_BUILD_NUMBER']}.")

if sys.argv[1] == "verify":
    evidence = None
    observation = None
    attempts = int(os.environ.get("TESTFLIGHT_VERIFY_ATTEMPTS", "181"))
    for attempt in range(attempts):
        builds = all_data(
            f"{API}/builds",
            {
                "filter[app]": app[0]["id"],
                "filter[version]": os.environ["TESTFLIGHT_BUILD_NUMBER"],
                "fields[builds]": "version,processingState",
                "limit": 2,
            },
        )
        if len(builds) == 1:
            build = builds[0]
            detail = SESSION.get(
                f"{API}/builds/{build['id']}/buildBetaDetail",
                headers=headers(),
                params={"fields[buildBetaDetails]": "externalBuildState"},
                timeout=30,
            )
            detail.raise_for_status()
            prerelease = SESSION.get(
                f"{API}/builds/{build['id']}/preReleaseVersion",
                headers=headers(),
                params={"fields[preReleaseVersions]": "version,platform"},
                timeout=30,
            )
            prerelease.raise_for_status()
            evidence = {
                "build": build,
                "external": detail.json()["data"]["attributes"]["externalBuildState"],
                "prerelease": prerelease.json()["data"]["attributes"],
                "group_builds": {
                    item["id"]
                    for item in all_data(
                        f"{API}/betaGroups/{os.environ['TESTFLIGHT_PUBLIC_GROUP_ID']}/relationships/builds",
                        {"limit": 200},
                    )
                },
            }
            next_observation = (
                build["attributes"]["processingState"],
                evidence["external"],
                build["id"] in evidence["group_builds"],
            )
            if next_observation != observation:
                print(
                    f"Observed build {os.environ['TESTFLIGHT_BUILD_NUMBER']}: "
                    f"processing={next_observation[0]}, external={next_observation[1]}, "
                    f"public_group={next_observation[2]}",
                    flush=True,
                )
                observation = next_observation
            assert evidence["external"] != "BETA_REJECTED", "Apple rejected the beta build."
            if (
                build["attributes"]["processingState"] == "VALID"
                and build["id"] in evidence["group_builds"]
                and evidence["external"] == "IN_BETA_TESTING"
            ):
                break
        if attempt < attempts - 1:
            time.sleep(30)
    assert evidence is not None, "The uploaded build did not appear in App Store Connect."
    assert evidence["build"]["attributes"]["version"] == os.environ["TESTFLIGHT_BUILD_NUMBER"], (
        f"Observed build number {evidence['build']['attributes']['version']}."
    )
    assert evidence["build"]["attributes"]["processingState"] == "VALID", (
        f"Observed processing state {evidence['build']['attributes']['processingState']}."
    )
    assert evidence["prerelease"] == {"version": APP_VERSION, "platform": "IOS"}, (
        f"Observed prerelease {evidence['prerelease']}."
    )
    assert evidence["build"]["id"] in evidence["group_builds"], (
        "The build is not assigned to the public TestFlight group."
    )
    assert evidence["external"] in ("IN_BETA_TESTING", "WAITING_FOR_BETA_REVIEW", "IN_BETA_REVIEW"), (
        f"Observed external build state {evidence['external']}."
    )
    print(
        f"Machtblick {APP_VERSION} ({os.environ['TESTFLIGHT_BUILD_NUMBER']}) is processed and available "
        f"through {os.environ['TESTFLIGHT_PUBLIC_GROUP']} at {PUBLIC_LINK}."
    )
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
        summary.write(
            f"Machtblick {APP_VERSION} ({os.environ['TESTFLIGHT_BUILD_NUMBER']}) from "
            f"`{os.environ['GITHUB_SHA']}` is processed and available through the public "
            f"TestFlight group.\n"
        )
