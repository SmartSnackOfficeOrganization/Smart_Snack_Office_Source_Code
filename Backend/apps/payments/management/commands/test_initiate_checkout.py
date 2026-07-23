import requests
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.authentication.token import get_tokens_for_user

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Prueba el endpoint real /api/payments/checkout/ de punta a punta "
        "con un usuario mock, sin depender de que `orders` exista todavía."
    )

    def add_arguments(self, parser):
        parser.add_argument("--amount", type=float, default=45000)
        parser.add_argument("--base-url", type=str, default="http://localhost:8000")

    def handle(self, *args, **options):
        amount = options["amount"]
        base_url = options["base_url"].rstrip("/")

        # Usuario mock reutilizable — no necesita pasar por el flujo de
        # registro/activación real, solo existir para probar el endpoint.
        user, created = User.objects.get_or_create(
            email="mock.buyer@smartsnack.test",
            defaults={"full_name": "Mock Buyer", "role": "buyer", "is_active": True},
        )
        if created:
            user.set_password("MockPass123")
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f"✓ Usuario mock creado: {user.email}")
            )
        else:
            self.stdout.write(f"Usando usuario mock existente: {user.email}")

        tokens = get_tokens_for_user(user)

        response = requests.post(
            f"{base_url}/api/payments/checkout/",
            headers={
                "Authorization": f"Bearer {tokens['access']}",
                "Content-Type": "application/json",
            },
            json={"amount": amount, "currency": "COP", "country": "CO"},
            timeout=10,
        )

        if response.status_code != 201:
            self.stdout.write(
                self.style.ERROR(f"✗ Error {response.status_code}: {response.text}")
            )
            return

        data = response.json()
        self.stdout.write(self.style.SUCCESS("\n✓ Checkout iniciado exitosamente\n"))
        self.stdout.write(f"Referencia: {data['reference']}")
        self.stdout.write(f"URL: {data['checkout_url']}\n")
