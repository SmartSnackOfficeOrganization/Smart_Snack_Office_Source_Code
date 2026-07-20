# apps/payments/management/commands/test_rapyd_checkout.py
from django.core.management.base import BaseCommand
from apps.payments.services import build_checkout_page


class Command(BaseCommand):
    help = "Crea una checkout page de prueba en Rapyd sandbox con datos mock"

    def handle(self, *args, **options):
        mock_order = {
            "reference": "MOCK-ORDER-001",
            "amount": 45000,
            "currency": "COP",
            "country": "CO",
        }
        result = build_checkout_page(**mock_order)
        self.stdout.write(self.style.SUCCESS(result["data"]["redirect_url"]))