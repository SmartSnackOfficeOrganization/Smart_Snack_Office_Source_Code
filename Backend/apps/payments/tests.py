import base64
import hashlib
import hmac
from unittest.mock import MagicMock, patch

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
# Create your tests here.
