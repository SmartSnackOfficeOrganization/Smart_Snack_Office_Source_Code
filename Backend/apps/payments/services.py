# apps/payments/services.py
import base64
import hashlib
import hmac
import json
import random
import string
import time

import requests
from django.conf import settings


def _generate_salt(length: int = 12) -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


def _sign_request(http_method: str, path: str, body_string: str) -> dict:
    salt = _generate_salt()
    timestamp = str(int(time.time()))
    to_sign = (
        http_method.lower() + path + salt + timestamp
        + settings.RAPYD_ACCESS_KEY + settings.RAPYD_SECRET_KEY + body_string
    )
    hex_digest = hmac.new(
        settings.RAPYD_SECRET_KEY.encode("utf-8"), to_sign.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    signature = base64.b64encode(hex_digest.encode("utf-8")).decode("utf-8")

    return {
        "access_key": settings.RAPYD_ACCESS_KEY,
        "salt": salt,
        "timestamp": timestamp,
        "signature": signature,
        "Content-Type": "application/json",
    }


def build_checkout_page(reference: str, amount: float, currency: str, country: str) -> dict:
    """
    Crea una hosted checkout page en el sandbox de Rapyd.
    Recibe primitivos
    """
    path = "/v1/checkout"
    body = {
        "amount": amount,
        "country": country,
        "currency": currency,
        "merchant_reference_id": reference,
        "complete_payment_url": f"{settings.BACKEND_URL}/api/payments/complete/",
        "error_payment_url": f"{settings.BACKEND_URL}/api/payments/error/",
    }
    body_string = json.dumps(body, separators=(",", ":"))
    headers = _sign_request("post", path, body_string)

    response = requests.post(
        f"{settings.RAPYD_BASE_URL}{path}", headers=headers, data=body_string, timeout=10
    )
    response.raise_for_status()
    return response.json()


def verify_rapyd_webhook(url_path: str, salt: str, timestamp: str, body_string: str, received_signature: str) -> bool:
    to_sign = (
        url_path + salt + timestamp
        + settings.RAPYD_ACCESS_KEY + settings.RAPYD_SECRET_KEY + body_string
    )
    hex_digest = hmac.new(
        settings.RAPYD_SECRET_KEY.encode("utf-8"), to_sign.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    computed = base64.b64encode(hex_digest.encode("utf-8")).decode("utf-8")
    return hmac.compare_digest(computed, received_signature)

def get_payment_status(payment_id: str) -> dict:
    path = f"/v1/payments/{payment_id}"
    headers = _sign_request("get", path, "")
    response = requests.get(
        f"{settings.RAPYD_BASE_URL}{path}", headers=headers, timeout=10
    )
    response.raise_for_status()
    return response.json()

def list_recent_payments() -> dict:
    path = "/v1/payments"
    headers = _sign_request("get", path, "")
    response = requests.get(
        f"{settings.RAPYD_BASE_URL}{path}", headers=headers, timeout=10
    )
    response.raise_for_status()
    return response.json()