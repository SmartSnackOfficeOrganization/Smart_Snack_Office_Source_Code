"""
Test de integración: flujo exitoso de registro + activación de cuenta para Buyer.

AJUSTÁ ESTO ANTES DE CORRER:
2. El `reverse('buyer-register')` y `reverse('activate-account', ...)` —
   poné el `name=` real que usaste en tus urls.py.
3. Si tu User usa otro campo único además de email, ajustá el payload.
"""

from django.urls import reverse
from django.core import mail
from django.utils.http import urlsafe_base64_decode
from rest_framework.test import APITestCase
from rest_framework import status
from .models import User               
from .models import BuyerProfile            


class BuyerRegistrationSuccessFlowTests(APITestCase):
    """
    Cubre el camino feliz completo:
    1. POST de registro -> 201, User creado inactivo, BuyerProfile creado.
    2. Se envió exactamente un email, con un link de activación bien formado.
    3. Hacer GET a ese link -> 200, el usuario queda is_active=True.
    """

    def setUp(self):
        self.register_url = reverse('register_buyer')  

        self.valid_payload = {
            "email": "Nuevo@Test.com",       # con mayúsculas a propósito,
            "full_name": "Nuevo Usuario",     # para probar normalización de paso
            "password": "ContraseñaSegura123!",
            "confirm_password": "ContraseñaSegura123!",
            "terms_accepted": True,
            "delivery_address": "Calle 123",
            "company_name": "",
        }

    def test_registration_creates_user_and_profile_and_sends_email(self):
        """El POST de registro debe crear User + BuyerProfile, y encolar un email."""
        response = self.client.post(self.register_url, self.valid_payload)

        # 1. Status code correcto
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 2. El User fue creado en la base de datos
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.get()

        # 3. El email se guardó normalizado (en minúsculas)
        self.assertEqual(user.email, "nuevo@test.com")

        # 4. El usuario se creó inactivo (pendiente de confirmación)
        self.assertFalse(user.is_active)

        # 5. El role es el esperado para este endpoint específico
        self.assertEqual(user.role, "buyer")

        # 6. El BuyerProfile fue creado y está correctamente vinculado
        self.assertEqual(BuyerProfile.objects.count(), 1)
        profile = BuyerProfile.objects.get()
        self.assertEqual(profile.user, user)
        self.assertEqual(profile.delivery_address, "Calle 123")

        # 7. Se envió exactamente un email (usando el backend de test de Django,
        #    que no manda nada real, solo lo guarda en mail.outbox)
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn(user.email, sent_email.to)
        self.assertIn("activate", sent_email.body.lower())

    def test_full_flow_register_then_activate_via_link_in_email(self):
        """
        El test más valioso de los dos: simula al usuario de punta a punta.
        Se registra, se extrae el link real del cuerpo del email (no se
        regenera el token a mano), y se "hace click" en él vía GET.
        """
        # Paso 1: registro
        response = self.client.post(self.register_url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get()
        self.assertFalse(user.is_active)  # todavía inactivo en este punto

        # Paso 2: extraer el link de activación del cuerpo del email enviado
        self.assertEqual(len(mail.outbox), 1)
        email_body = mail.outbox[0].body

        # Asumiendo el formato: http://localhost:8000/api/activate/<uidb64>/<token>/
        # Ajustá este parseo si tu formato real de URL es distinto.
        activation_url_in_email = self._extract_url(email_body)
        self.assertIsNotNone(
            activation_url_in_email,
            "No se encontró una URL de activación en el cuerpo del email"
        )

        # Paso 3: "hacer click" -> golpear esa misma URL con un GET real
        # Usamos el path tal cual viene en el email para no asumir nada más.
        path = self._url_to_path(activation_url_in_email)
        activation_response = self.client.get(path)

        self.assertEqual(activation_response.status_code, status.HTTP_200_OK)

        # Paso 4: refrescar el user desde la DB y confirmar que quedó activo
        user.refresh_from_db()
        self.assertTrue(user.is_active)

    # --- helpers internos del test ---

    @staticmethod
    def _extract_url(text):
        """Extrae la primera URL http(s) encontrada en un bloque de texto."""
        import re
        match = re.search(r'https?://[^\s]+', text)
        return match.group(0) if match else None

    @staticmethod
    def _url_to_path(full_url):
        """Convierte una URL absoluta (http://host:puerto/path/) en solo el path,
        que es lo que self.client.get() espera."""
        from urllib.parse import urlparse
        return urlparse(full_url).path
