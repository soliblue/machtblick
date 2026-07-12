import json
import sys

import requests

from asc_api import headers

ORPHAN_NAME = "Created via API"
DEV_TYPES = {"DEVELOPMENT", "IOS_DEVELOPMENT"}
API = "https://api.appstoreconnect.apple.com/v1/certificates"


def all_dev_certs():
    certs = []
    url = f"{API}?limit=200"
    while url:
        response = requests.get(url, headers=headers())
        response.raise_for_status()
        body = response.json()
        certs.extend(body.get("data", []))
        url = body.get("links", {}).get("next")
    return [c for c in certs if c["attributes"].get("certificateType") in DEV_TYPES]


def orphan_ids():
    return {
        cert["id"]
        for cert in all_dev_certs()
        if ORPHAN_NAME in cert["attributes"].get("name", "")
    }


def revoke(ids):
    head = headers()
    for cert_id in ids:
        resp = requests.delete(f"{API}/{cert_id}", headers=head)
        print(f"  revoke {cert_id}: {resp.status_code}")
    print(f"Revoked {len(ids)} '{ORPHAN_NAME}' development certificate(s).")


command = sys.argv[1]

if command == "snapshot":
    before = orphan_ids()
    with open(sys.argv[2], "w") as f:
        json.dump(sorted(before), f)
    print(f"Snapshotted {len(before)} existing '{ORPHAN_NAME}' dev cert(s) before build.")

if command == "revoke-new":
    with open(sys.argv[2]) as f:
        before = set(json.load(f))
    revoke(orphan_ids() - before)

if command == "revoke-all":
    revoke(orphan_ids())
