import base64
import json
import os
import time

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature


def headers():
    key = serialization.load_pem_private_key(
        os.environ["APP_STORE_CONNECT_API_KEY_CONTENT"].encode(), password=None
    )
    key_id = os.environ["APP_STORE_CONNECT_API_KEY_ID"]
    header = {"alg": "ES256", "kid": key_id, "typ": "JWT"}
    now = int(time.time())
    payload = {
        "iss": os.environ["APP_STORE_CONNECT_API_ISSUER_ID"],
        "aud": "appstoreconnect-v1",
        "sub": key_id,
        "iat": now,
        "exp": now + 1200,
    }
    segments = [
        base64.urlsafe_b64encode(json.dumps(part).encode()).rstrip(b"=").decode()
        for part in (header, payload)
    ]
    message = ".".join(segments)
    r, s = decode_dss_signature(key.sign(message.encode(), ec.ECDSA(hashes.SHA256())))
    signature = r.to_bytes(32, "big") + s.to_bytes(32, "big")
    return {
        "Authorization": f"Bearer {message}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode()}"
    }
