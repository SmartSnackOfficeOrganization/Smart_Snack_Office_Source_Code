import base64
import hashlib
import hmac
from unittest.mock import MagicMock, patch
import json

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Payment
from .services import process_payment_webhook
from django.test import TestCase, override_settings

from .services import build_checkout_page, verify_rapyd_webhook


@override_settings(
    RAPYD_ACCESS_KEY="test_access",
    RAPYD_SECRET_KEY="test_secret",
    RAPYD_BASE_URL="https://sandboxapi.rapyd.net",
    BACKEND_URL="http://localhost:8000",
)
class BuildCheckoutPageTests(TestCase):
    @patch("apps.payments.services.requests.post")
    def test_sends_correct_payload_and_signed_headers(self, mock_post):
        mock_post.return_value = MagicMock(
            json=lambda: {"data": {"redirect_url": "https://sandboxcheckout.rapyd.net/xyz"}}
        )
        mock_post.return_value.raise_for_status = lambda: None

        result = build_checkout_page(
            reference="ORD-123", amount=45000, currency="COP", country="CO"
        )

        self.assertEqual(result["data"]["redirect_url"], "https://sandboxcheckout.rapyd.net/xyz")
        headers = mock_post.call_args.kwargs["headers"]
        self.assertEqual(headers["access_key"], "test_access")
        self.assertIn("signature", headers)


@override_settings(RAPYD_ACCESS_KEY="test_access", RAPYD_SECRET_KEY="test_secret")
class VerifyRapydWebhookTests(TestCase):
    def _sign(self, url_path, salt, timestamp, body_string):
        to_sign = url_path + salt + timestamp + "test_access" + "test_secret" + body_string
        hex_digest = hmac.new(b"test_secret", to_sign.encode(), hashlib.sha256).hexdigest()
        return base64.b64encode(hex_digest.encode()).decode()

    def test_valid_signature_is_accepted(self):
        body = '{"status":"CLO"}'
        sig = self._sign("api/payments/callback/", "abc123", "1700000000", body)
        self.assertTrue(
            verify_rapyd_webhook("api/payments/callback/", "abc123", "1700000000", body, sig)
        )

    def test_tampered_body_is_rejected(self):
        body = '{"status":"CLO"}'
        sig = self._sign("api/payments/callback/", "abc123", "1700000000", body)
        tampered_body = '{"status":"ERR"}'
        self.assertFalse(
            verify_rapyd_webhook("api/payments/callback/", "abc123", "1700000000", tampered_body, sig)
        )

def _sign(url_path, salt, timestamp, body_string, access_key="test_access", secret_key="test_secret"):
    to_sign = url_path + salt + timestamp + access_key + secret_key + body_string
    hex_digest = hmac.new(secret_key.encode(), to_sign.encode(), hashlib.sha256).hexdigest()
    return base64.b64encode(hex_digest.encode()).decode()


SAMPLE_WEBHOOK = {
    "id": "wh_test123",
    "type": "PAYMENT_COMPLETED",
    "data": {
        "id": "payment_test123",
        "amount": 45000,
        "original_amount": 45000,
        "is_partial": False,
        "currency_code": "COP",
        "country_code": "CO",
        "status": "CLO",
        "description": "Payment via Checkout",
        "merchant_reference_id": "ORD-TEST-001",
        "customer_token": "cus_test123",
        "payment_method_type": "co_visa_m_card",
        "payment_method_data": {"last4": "1111"},
        "auth_code": "12345A",
        "refunded": False,
        "refunded_amount": 0,
        "redirect_url": "",
        "complete_payment_url": "",
        "error_payment_url": "",
        "failure_code": "",
        "failure_message": "",
        "ewallet_id": "",
        "ewallets": [],
        "metadata": {},
        "created_at": 1784508611,
        "paid": True,
        "paid_at": 1784508615,
    },
}


class ProcessPaymentWebhookTests(TestCase):
    def test_creates_payment_on_first_call(self):
        result = process_payment_webhook(SAMPLE_WEBHOOK)

        self.assertEqual(result["status"], "success")
        self.assertTrue(result["created"])
        payment = Payment.objects.get()
        self.assertEqual(payment.rapyd_payment_id, "payment_test123")
        self.assertEqual(payment.status, "CLO")
        self.assertTrue(payment.paid)

    def test_retry_updates_instead_of_duplicating(self):
        """Simula lo que viste en el inspector de ngrok: Rapyd reintentando
        el mismo evento (status: RET) varias veces."""
        process_payment_webhook(SAMPLE_WEBHOOK)
        result = process_payment_webhook(SAMPLE_WEBHOOK)  # mismo payment_id

        self.assertFalse(result["created"])
        self.assertEqual(Payment.objects.count(), 1)  # no duplicó

    def test_missing_payment_id_returns_error(self):
        result = process_payment_webhook({"data": {}})
        self.assertEqual(result["status"], "error")
        self.assertEqual(Payment.objects.count(), 0)


@override_settings(RAPYD_ACCESS_KEY="test_access", RAPYD_SECRET_KEY="test_secret")
class PaymentCallbackViewTests(APITestCase):
    def test_valid_webhook_creates_payment_in_db(self):
        body = json.dumps(SAMPLE_WEBHOOK, separators=(",", ":"))
        full_url = "http://testserver/api/payments/callback/"
        signature = _sign(full_url, "testsalt", "1784508767", body)

        response = self.client.post(
            "/api/payments/callback/",
            data=body,
            content_type="application/json",
            HTTP_SALT="testsalt",
            HTTP_TIMESTAMP="1784508767",
            HTTP_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Payment.objects.count(), 1)

    def test_invalid_signature_rejected_and_nothing_persisted(self):
        body = json.dumps(SAMPLE_WEBHOOK, separators=(",", ":"))

        response = self.client.post(
            "/api/payments/callback/",
            data=body,
            content_type="application/json",
            HTTP_SALT="testsalt",
            HTTP_TIMESTAMP="1784508767",
            HTTP_SIGNATURE="firma-que-no-corresponde",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Payment.objects.count(), 0)
