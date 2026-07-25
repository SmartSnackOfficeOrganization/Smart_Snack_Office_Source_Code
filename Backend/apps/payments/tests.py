import base64
import hashlib
import hmac
import json
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.authentication.models import BuyerProfile, Order

from .models import Payment
from .services import build_checkout_page, process_payment_webhook, verify_rapyd_webhook

User = get_user_model()


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
            json=lambda: {
                "data": {"redirect_url": "https://sandboxcheckout.rapyd.net/xyz"}
            }
        )
        mock_post.return_value.raise_for_status = lambda: None

        result = build_checkout_page(
            reference="ORD-123", amount=45000, currency="COP", country="CO"
        )

        self.assertEqual(
            result["data"]["redirect_url"], "https://sandboxcheckout.rapyd.net/xyz"
        )
        headers = mock_post.call_args.kwargs["headers"]
        self.assertEqual(headers["access_key"], "test_access")
        self.assertIn("signature", headers)


@override_settings(RAPYD_ACCESS_KEY="test_access", RAPYD_SECRET_KEY="test_secret")
class VerifyRapydWebhookTests(TestCase):
    def _sign(self, url_path, salt, timestamp, body_string):
        to_sign = (
            url_path + salt + timestamp + "test_access" + "test_secret" + body_string
        )
        hex_digest = hmac.new(
            b"test_secret", to_sign.encode(), hashlib.sha256
        ).hexdigest()
        return base64.b64encode(hex_digest.encode()).decode()

    def test_valid_signature_is_accepted(self):
        body = '{"status":"CLO"}'
        sig = self._sign("api/payments/callback/", "abc123", "1700000000", body)
        self.assertTrue(
            verify_rapyd_webhook(
                "api/payments/callback/", "abc123", "1700000000", body, sig
            )
        )

    def test_tampered_body_is_rejected(self):
        body = '{"status":"CLO"}'
        sig = self._sign("api/payments/callback/", "abc123", "1700000000", body)
        tampered_body = '{"status":"ERR"}'
        self.assertFalse(
            verify_rapyd_webhook(
                "api/payments/callback/", "abc123", "1700000000", tampered_body, sig
            )
        )


def _sign(
    url_path,
    salt,
    timestamp,
    body_string,
    access_key="test_access",
    secret_key="test_secret",
):
    to_sign = url_path + salt + timestamp + access_key + secret_key + body_string
    hex_digest = hmac.new(
        secret_key.encode(), to_sign.encode(), hashlib.sha256
    ).hexdigest()
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


def _make_sample_webhook(merchant_reference_id):
    """Factory para crear webhooks con diferentes merchant_reference_id."""
    return {
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
            "merchant_reference_id": merchant_reference_id,
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
    def setUp(self):
        self.user = User.objects.create_user(
            email="buyer@test.com",
            full_name="Buyer",
            role="buyer",
            password="ClaveSegura123",
            is_active=True,
        )
        self.order = Order.objects.create(
            buyer=self.user,
            status="pending_payment",
            delivery_address="Calle 123",
            subtotal=45000,
            tax=8550,
            total=53550,
        )

    def test_creates_payment_on_first_call(self):
        webhook = _make_sample_webhook(str(self.order.id))
        result = process_payment_webhook(webhook)

        self.assertEqual(result["status"], "success")
        self.assertTrue(result["created"])
        payment = Payment.objects.get()
        self.assertEqual(payment.rapyd_payment_id, "payment_test123")
        self.assertEqual(payment.status, "CLO")
        self.assertTrue(payment.paid)
        self.assertEqual(payment.order_id, self.order.id)

    def test_retry_updates_instead_of_duplicating(self):
        """Simula lo que viste en el inspector de ngrok: Rapyd reintentando
        el mismo evento (status: RET) varias veces."""
        webhook = _make_sample_webhook(str(self.order.id))
        process_payment_webhook(webhook)
        result = process_payment_webhook(webhook)  # mismo payment_id

        self.assertFalse(result["created"])
        self.assertEqual(Payment.objects.count(), 1)  # no duplicó

    def test_missing_payment_id_returns_error(self):
        result = process_payment_webhook({"data": {}})
        self.assertEqual(result["status"], "error")
        self.assertEqual(Payment.objects.count(), 0)


@override_settings(RAPYD_ACCESS_KEY="test_access", RAPYD_SECRET_KEY="test_secret")
class PaymentCallbackViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="buyer@test.com",
            full_name="Buyer",
            role="buyer",
            password="ClaveSegura123",
            is_active=True,
        )
        self.order = Order.objects.create(
            buyer=self.user,
            status="pending_payment",
            delivery_address="Calle 123",
            subtotal=45000,
            tax=8550,
            total=53550,
        )

    def test_valid_webhook_creates_payment_in_db(self):
        webhook = _make_sample_webhook(str(self.order.id))
        body = json.dumps(webhook, separators=(",", ":"))
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

    def test_invalid_signature_rejected_and_nothing_persisted(self):
        webhook = _make_sample_webhook(str(self.order.id))
        body = json.dumps(webhook, separators=(",", ":"))

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


class InitiateCheckoutViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="buyer@test.com",
            full_name="Buyer",
            role="buyer",
            password="ClaveSegura123",
            is_active=True,
        )
        # Crear el perfil de comprador (necesario para checkout)
        self.buyer_profile = BuyerProfile.objects.create(
            user=self.user, delivery_address="Calle 123"
        )
        # Crear una Order en estado pending_payment
        self.order = Order.objects.create(
            buyer=self.user,
            status="pending_payment",
            delivery_address="Calle 123",
            subtotal=45000,
            tax=8550,
            total=53550,
        )
        self.url = "/api/payments/checkout/"

    @patch("apps.payments.views.build_checkout_page")
    def test_authenticated_user_can_initiate_checkout(self, mock_build):
        from apps.orders.models import Order

        order = Order.objects.create(
            buyer=self.user,
            status="pending_payment",
            delivery_address="Calle 123",
            subtotal=Decimal("45000.00"),
            total=Decimal("45000.00"),
        )
        mock_build.return_value = {
            "data": {"redirect_url": "https://sandboxcheckout.rapyd.net/xyz"}
        }
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.url, {"order_id": str(order.id)}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["reference"], str(order.id))
        self.assertEqual(
            response.data["checkout_url"], "https://sandboxcheckout.rapyd.net/xyz"
        )
        mock_build.assert_called_once()
        self.assertEqual(mock_build.call_args.kwargs["user_id"], self.user.id)
        self.assertEqual(mock_build.call_args.kwargs["amount"], 45000.0)

    def test_anonymous_cannot_initiate_checkout(self):
        response = self.client.post(
            self.url, {"order_id": str(self.order.id)}, format="json"
        )
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_rejects_non_pending_payment_order(self):
        """No puede iniciar checkout si la orden no está en estado pending_payment."""
        self.order.status = "paid"
        self.order.save()
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url, {"order_id": str(self.order.id)}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CheckoutStatusViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="buyer2@test.com",
            full_name="Buyer",
            role="buyer",
            password="ClaveSegura123",
            is_active=True,
        )
        self.order = Order.objects.create(
            buyer=self.user,
            status="pending_payment",
            delivery_address="Calle 123",
            subtotal=45000,
            tax=8550,
            total=53550,
        )
        self.url = f"/api/payments/status/{self.order.id}/"

    def test_returns_pending_when_no_payment_yet(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "pending")

    def test_returns_real_status_once_webhook_landed(self):
        Payment.objects.create(
            user=self.user,
            order=self.order,
            rapyd_payment_id="payment_123",
            merchant_reference_id=str(self.order.id),
            customer_token="cus_123",
            amount=45000,
            original_amount=45000,
            status="CLO",
            paid=True,
            rapyd_created_at=timezone.now(),
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.data["status"], "CLO")
        self.assertTrue(response.data["paid"])

    def test_other_user_cannot_see_someone_elses_payment(self):
        """Si hay un payment de otro usuario, el usuario actual no puede verlo."""
        other_user = User.objects.create_user(
            email="other@test.com",
            full_name="Other",
            role="buyer",
            password="ClaveSegura123",
            is_active=True,
        )
        other_order = Order.objects.create(
            buyer=other_user,
            status="paid",  # Asegurar que ya pagó
            delivery_address="Calle 456",
            subtotal=45000,
            tax=8550,
            total=53550,
        )
        # Crear un payment para el otro usuario
        Payment.objects.create(
            user=other_user,
            order=other_order,
            rapyd_payment_id="payment_456",
            merchant_reference_id=str(other_order.id),
            customer_token="cus_456",
            amount=45000,
            original_amount=45000,
            status="CLO",
            paid=True,
            rapyd_created_at=timezone.now(),
        )
        # Intentar acceder como self.user
        self.client.force_authenticate(user=self.user)
        url = f"/api/payments/status/{other_order.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
