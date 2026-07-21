from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Crea un usuario de prueba"

    def add_arguments(self, parser):
        parser.add_argument('--email', default='buyer@example.com', help='Email')
        parser.add_argument('--name', default='Test Buyer', help='Nombre')
        parser.add_argument('--role', default='buyer', help='Rol (buyer/seller/admin)')
        parser.add_argument('--password', default='password123', help='Contraseña')

    def handle(self, *args, **options):
        email = options['email']
        name = options['name']
        role = options['role']
        password = options['password']

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': name,
                'role': role,
                'is_active': True,
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"✓ Usuario creado: {email}"))
            self.stdout.write(f"UUID: {user.id}")
        else:
            self.stdout.write(self.style.WARNING(f"⚠ Usuario ya existe: {email}"))