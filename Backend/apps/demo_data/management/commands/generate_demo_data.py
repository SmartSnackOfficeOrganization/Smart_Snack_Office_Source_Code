from django.core.management.base import BaseCommand

from apps.demo_data.config import DemoDataConfig
from apps.demo_data.orchestrator import DemoDataOrchestrator


class Command(BaseCommand):
    help = (
        "Genera datos demo realistas y coherentes (usuarios, productos, ordenes, "
        "pagos mock y resenas) para desarrollo y algoritmos de recomendacion."
    )

    def add_arguments(self, parser):
        parser.add_argument("--buyers", type=int, default=50, help="Numero de buyers")
        parser.add_argument("--sellers", type=int, default=5, help="Numero de sellers")
        parser.add_argument(
            "--products", type=int, default=100, help="Numero de productos"
        )
        parser.add_argument("--orders", type=int, default=300, help="Numero de ordenes")
        parser.add_argument(
            "--reviews", type=int, default=150, help="Numero objetivo de resenas"
        )
        parser.add_argument(
            "--seed", type=int, default=42, help="Semilla RNG para reproducibilidad"
        )
        parser.add_argument(
            "--password",
            type=str,
            default="DemoPass123!",
            help="Password compartido para usuarios demo",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Elimina usuarios *@demo.smartsnack.local y datos en cascada antes de generar",
        )

    def handle(self, *args, **options):
        config = DemoDataConfig(
            buyers=max(0, options["buyers"]),
            sellers=max(0, options["sellers"]),
            products=max(0, options["products"]),
            orders=max(0, options["orders"]),
            reviews=max(0, options["reviews"]),
            seed=options["seed"],
            clear=options["clear"],
            password=options["password"],
        )

        self.stdout.write(
            self.style.NOTICE(
                f"Generando demo data (seed={config.seed}, clear={config.clear})..."
            )
        )

        summary = DemoDataOrchestrator(config).run()

        if summary.cleared_users:
            self.stdout.write(
                self.style.WARNING(
                    f"Eliminados {summary.cleared_users} objetos de usuarios demo (cascada)."
                )
            )

        self.stdout.write(self.style.SUCCESS("Demo data generada:"))
        self.stdout.write(f"  Sellers : {summary.sellers}")
        self.stdout.write(f"  Buyers  : {summary.buyers}")
        self.stdout.write(f"  Products: {summary.products}")
        self.stdout.write(f"  Orders  : {summary.orders}")
        self.stdout.write(f"  Reviews : {summary.reviews}")

        if summary.sample_buyer_email:
            self.stdout.write(
                f"  Login buyer  : {summary.sample_buyer_email} / {summary.password}"
            )
        if summary.sample_seller_email:
            self.stdout.write(
                f"  Login seller : {summary.sample_seller_email} / {summary.password}"
            )

        for note in summary.notes:
            self.stdout.write(self.style.WARNING(f"  Nota: {note}"))
