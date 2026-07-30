from apps.payments.services import build_checkout_page
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Crea una checkout page de prueba en Rapyd sandbox con datos mock"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user-id",
            type=str,
            help="UUID del usuario que realiza la compra",
            required=False,
        )
        parser.add_argument(
            "--amount",
            type=float,
            default=45000,
            help="Monto a pagar (default: 45000)",
        )
        parser.add_argument(
            "--reference",
            type=str,
            default="MOCK-ORDER-001",
            help="Referencia de la orden (default: MOCK-ORDER-001)",
        )

    def handle(self, *args, **options):
        user_id = options.get("user_id")
        amount = options.get("amount")
        reference = options.get("reference")

        # Incluir user_id en la referencia si se proporciona
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                reference = f"{reference}-{user.email.split('@')[0]}"
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Usuario encontrado: {user.email}")
                )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"✗ Usuario con ID {user_id} no existe")
                )
                return

        mock_order = {
            "reference": reference,
            "amount": amount,
            "currency": "COP",
            "country": "CO",
            "user_id": user_id,
        }

        try:
            result = build_checkout_page(**mock_order)
            checkout_url = result["data"]["redirect_url"]

            self.stdout.write(self.style.SUCCESS("\n✓ Checkout creado exitosamente\n"))
            self.stdout.write(f"Referencia: {reference}")
            self.stdout.write(f"Monto: {amount} COP")
            if user_id:
                self.stdout.write(f"Usuario: {user.email}")
            self.stdout.write(f"\nURL: {checkout_url}\n")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Error: {str(e)}"))
