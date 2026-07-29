# apps/payments/services.py
import base64
import hashlib
import hmac
import json
import logging
import random
import string
import time
from datetime import datetime
from datetime import timezone as dt_timezone

import requests
from django.conf import settings
from django.core.exceptions import ValidationError

from .models import Payment

logger = logging.getLogger(__name__)


def _generate_salt(length: int = 12) -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


def _sign_request(http_method: str, path: str, body_string: str) -> dict:
    salt = _generate_salt()
    timestamp = str(int(time.time()))
    to_sign = (
        http_method.lower()
        + path
        + salt
        + timestamp
        + settings.RAPYD_ACCESS_KEY
        + settings.RAPYD_SECRET_KEY
        + body_string
    )
    hex_digest = hmac.new(
        settings.RAPYD_SECRET_KEY.encode("utf-8"),
        to_sign.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    signature = base64.b64encode(hex_digest.encode("utf-8")).decode("utf-8")

    return {
        "access_key": settings.RAPYD_ACCESS_KEY,
        "salt": salt,
        "timestamp": timestamp,
        "signature": signature,
        "Content-Type": "application/json",
    }


def build_checkout_page(
    reference: str,
    amount: float,
    currency: str,
    country: str,
    user_id: str = None,
    complete_url: str = None,
    error_url: str = None,
) -> dict:
    """
    Crea una hosted checkout page en el sandbox de Rapyd.
    complete_url/error_url son opcionales: si no se pasan, Rapyd
    redirige de vuelta a su propia página de checkout (sin tocar tu
    backend/ngrok). Si se pasan, Rapyd redirige a esas URLs después de completar o fallar el pago.
    """
    path = "/v1/checkout"
    body = {
        "amount": f"{float(amount):.2f}",
        "country": country,
        "currency": currency,
        "merchant_reference_id": reference,
    }
    if complete_url:
        body["complete_payment_url"] = complete_url
    if error_url:
        body["error_payment_url"] = error_url
    if user_id:
        body["metadata"] = {"user_id": str(user_id)}

    body_string = json.dumps(body, separators=(",", ":"))
    headers = _sign_request("post", path, body_string)

    response = requests.post(
        f"{settings.RAPYD_BASE_URL}{path}",
        headers=headers,
        data=body_string,
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def verify_rapyd_webhook(
    url_path: str, salt: str, timestamp: str, body_string: str, received_signature: str
) -> bool:
    to_sign = (
        url_path
        + salt
        + timestamp
        + settings.RAPYD_ACCESS_KEY
        + settings.RAPYD_SECRET_KEY
        + body_string
    )
    hex_digest = hmac.new(
        settings.RAPYD_SECRET_KEY.encode("utf-8"),
        to_sign.encode("utf-8"),
        hashlib.sha256,
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


def process_payment_webhook(webhook_data: dict, user_id: str = None) -> dict:
    payment_data = webhook_data.get("data", {})
    payment_id = payment_data.get("id")

    if not payment_id:
        return {"status": "error", "message": "No payment ID provided"}

    try:
        rapyd_created_at = datetime.fromtimestamp(
            payment_data.get("created_at", 0), tz=dt_timezone.utc
        )
        rapyd_paid_at = None
        if payment_data.get("paid_at"):
            rapyd_paid_at = datetime.fromtimestamp(
                payment_data.get("paid_at"), tz=dt_timezone.utc
            )

        user = None
        metadata = payment_data.get("metadata", {})
        webhook_user_id = metadata.get("user_id") or user_id

        if webhook_user_id:
            from django.contrib.auth import get_user_model

            User = get_user_model()
            try:
                user = User.objects.get(id=webhook_user_id)
            except User.DoesNotExist:
                pass

        merchant_reference_id = payment_data.get("merchant_reference_id", "")
        from apps.orders.models import Order

        order = None
        if merchant_reference_id:
            try:
                order = Order.objects.filter(id=merchant_reference_id).first()
            except (ValueError, ValidationError):
                logger.warning(
                    "merchant_reference_id no es un UUID válido: %s",
                    merchant_reference_id,
                )

        if not order:
            logger.warning(
                "Webhook recibido sin Order asociado: %s", merchant_reference_id
            )

        payment, created = Payment.objects.update_or_create(
            rapyd_payment_id=payment_id,
            defaults={
                "user": user,
                "order": order,
                "merchant_reference_id": merchant_reference_id,
                "customer_token": payment_data.get("customer_token", ""),
                "amount": payment_data.get("amount", 0),
                "original_amount": payment_data.get("original_amount", 0),
                "currency_code": payment_data.get("currency_code", "COP"),
                "country_code": payment_data.get("country_code", "CO"),
                "status": payment_data.get("status", "INIT"),
                "paid": payment_data.get("paid", False),
                "refunded": payment_data.get("refunded", False),
                "refunded_amount": payment_data.get("refunded_amount", 0),
                "is_partial": payment_data.get("is_partial", False),
                "description": payment_data.get("description", ""),
                "payment_method_type": payment_data.get("payment_method_type", ""),
                "payment_method_data": payment_data.get("payment_method_data"),
                "auth_code": payment_data.get("auth_code", ""),
                "authentication_result": payment_data.get("authentication_result"),
                "redirect_url": payment_data.get("redirect_url", ""),
                "complete_payment_url": payment_data.get("complete_payment_url", ""),
                "error_payment_url": payment_data.get("error_payment_url", ""),
                "failure_code": payment_data.get("failure_code", ""),
                "failure_message": payment_data.get("failure_message", ""),
                "ewallet_id": payment_data.get("ewallet_id", ""),
                "ewallets": payment_data.get("ewallets"),
                "webhook_metadata": metadata,
                "rapyd_created_at": rapyd_created_at,
                "rapyd_paid_at": rapyd_paid_at,
            },
        )

        if order:
            _sync_order_status(order, payment)

        return {
            "status": "success",
            "created": created,
            "payment": payment,
            "message": f"Payment {'created' if created else 'updated'} successfully",
        }

    except Exception as e:
        return {"status": "error", "message": f"Error processing payment: {str(e)}"}


def _sync_order_status(order, payment: "Payment") -> None:
    """
    Traduce el resultado del pago a una transición de estado del
    Order, delegando toda la lógica de negocio (stock, idempotencia)
    al propio modelo Order.
    """
    if payment.status == "CLO" and payment.paid:
        order.mark_as_paid(transaction_id=payment.rapyd_payment_id)
    elif payment.status in ("ERR", "CAN", "EXP"):
        order.mark_as_payment_failed()
