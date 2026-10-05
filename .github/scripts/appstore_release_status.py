import json

import requests

from asc_api import headers

API = "https://api.appstoreconnect.apple.com/v1"
response = requests.get(
    f"{API}/apps",
    headers=headers(),
    params={"filter[bundleId]": "soli.Machtblick", "fields[apps]": "bundleId,name", "limit": 2},
    timeout=30,
)
response.raise_for_status()
apps = response.json()["data"]
assert len(apps) == 1
response = requests.get(
    f"{API}/apps/{apps[0]['id']}/appStoreVersions",
    headers=headers(),
    params={
        "include": "build",
        "fields[appStoreVersions]": "versionString,platform,appStoreState,releaseType,build",
        "fields[builds]": "version,processingState",
        "limit": 200,
    },
    timeout=30,
)
response.raise_for_status()
print(json.dumps({"app": apps[0], "versions": response.json()}, indent=2))
