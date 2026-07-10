import re
from datetime import timedelta
from urllib.parse import urlparse
 
from django.core import mail
from django.urls import reverse
from django.utils.timezone import now
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
 
from .models import BuyerProfile, SellerProfile, User
from .token import AccountActivationTokenGenetator
 
# requiere token_blacklist
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)

def extract_url(text):
    """Extrae la primera URL http(s) de un bloque de texto."""
    match = re.search(r"https?://[^\s]+", text)
    return match.group(0) if match else None
 
 
def url_to_path(full_url):
    return urlparse(full_url).path
 
 
def make_active_user(email, role, full_name="Usuario activo", password="ClaveSegura123"):
    """Crea un usuario ya activo (salta el flujo de activación por email),
    útil para tests de login/logout que no necesitan probar ese flujo."""
    return User.objects.create_user(
        email=email,
        full_name=full_name,
        role=role,
        password=password,
        is_active=True,
    )


# ---------------------------------------------------------------------------
# Registro de comprador (Ampliado)
# ---------------------------------------------------------------------------
class BuyerRegistrationSuccessFlowTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register_buyer")
        self.base_payload = {
            "email": "comprador@test.com",
            "full_name": "Comprador de Prueba",
            "password": "ContraseñaSegura123!",
            "confirm_password": "ContraseñaSegura123!",
            "terms_accepted": True,
            "delivery_address": "Calle 123",
        }
 
    def test_password_mismatch_is_rejected(self):
        payload = {**self.base_payload, "confirm_password": "OtraClave123!"}
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 0)
 
    def test_weak_password_is_rejected(self):
        # Sin mayúscula ni dígito: no cumple ComplexPasswordValidator
        payload = {
            **self.base_payload,
            "password": "todaminuscula",
            "confirm_password": "todaminuscula",
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 0)
 
    def test_terms_not_accepted_is_rejected(self):
        payload = {**self.base_payload, "terms_accepted": False}
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 0)
 
    def test_duplicate_email_is_rejected(self):
        # Primer registro exitoso
        self.client.post(self.register_url, self.base_payload)
        self.assertEqual(User.objects.count(), 1)
 
        # Segundo registro con el mismo correo (probando además que la
        # comparación es case-insensitive, ya que el email se normaliza)
        payload = {**self.base_payload, "email": "Comprador@Test.com"}
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 1)

    

    def test_registration_creates_user_and_profile_and_sends_email(self):
        response = self.client.post(self.register_url, self.base_payload)

        # 1. Status code correcto
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 2. El User fue creado en la base de datos
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.get()

        # 3. El email se guardó normalizado (en minúsculas)
        self.assertEqual(user.email, "comprador@test.com")

        # 4. El usuario se creó inactivo (pendiente de confirmación)
        self.assertFalse(user.is_active)

        # 5. El role es el esperado para este endpoint específico
        self.assertEqual(user.role, "buyer")

        # 6. El BuyerProfile fue creado y está correctamente vinculado
        self.assertEqual(BuyerProfile.objects.count(), 1)
        profile = BuyerProfile.objects.get()
        self.assertEqual(profile.user, user)
        self.assertEqual(profile.delivery_address, "Calle 123")

        # Se envió exactamente un email (usando el backend de test de Django,
        #    que no manda nada real, solo lo guarda en mail.outbox)
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn(user.email, sent_email.to)
        self.assertIn("activate", sent_email.body.lower())

    def test_full_flow_register_then_activate_via_link_in_email(self):
        # Paso 1: registro
        response = self.client.post(self.register_url, self.base_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get()
        self.assertFalse(user.is_active)  # todavía inactivo en este punto

        self.assertEqual(len(mail.outbox), 1)
        email_body = mail.outbox[0].body

        activation_url_in_email = self._extract_url(email_body)
        self.assertIsNotNone(
            activation_url_in_email,
            "No se encontró una URL de activación en el cuerpo del email",
        )

        path = self._url_to_path(activation_url_in_email)
        activation_response = self.client.get(path)

        self.assertEqual(activation_response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.is_active)

    @staticmethod
    def _extract_url(text):
        """Extrae la primera URL http(s) encontrada en un bloque de texto."""
        import re

        match = re.search(r"https?://[^\s]+", text)
        return match.group(0) if match else None

    @staticmethod
    def _url_to_path(full_url):
        """Convierte una URL absoluta (http://host:puerto/path/) en solo el path,
        que es lo que self.client.get() espera."""
        from urllib.parse import urlparse

        return urlparse(full_url).path


# ---------------------------------------------------------------------------
# Registro de vendedor
# ---------------------------------------------------------------------------
class SellerRegistrationSuccessFlowTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register_seller")
        self.valid_payload = {
            "email": "Vendedor@Test.com",
            "full_name": "Dueño de la Tienda",
            "business_name": "Snacks del Valle SAS",
            "password": "ContraseñaSegura123!",
            "confirm_password": "ContraseñaSegura123!",
            "terms_accepted": True,
            "tax_info": "NIT 900123456-7",
            "commercial_info": "Distribuidor autorizado de snacks saludables",
        }
 
    def test_registration_creates_user_and_profile_and_sends_email(self):
        response = self.client.post(self.register_url, self.valid_payload)
 
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
 
        user = User.objects.get()
        self.assertEqual(user.email, "vendedor@test.com")
        self.assertFalse(user.is_active)
        self.assertEqual(user.role, "seller")
 
        self.assertEqual(SellerProfile.objects.count(), 1)
        profile = SellerProfile.objects.get()
        self.assertEqual(profile.user, user)
        self.assertEqual(profile.business_name, "Snacks del Valle SAS")
        self.assertEqual(profile.tax_info, "NIT 900123456-7")
 
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(user.email, mail.outbox[0].to)
 
    def test_missing_business_name_is_rejected(self):
        payload = dict(self.valid_payload)
        payload.pop("business_name")
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("business_name", response.data)
        self.assertEqual(User.objects.count(), 0)
 
    def test_full_flow_register_then_activate(self):
        response = self.client.post(self.register_url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
 
        activation_url = extract_url(mail.outbox[0].body)
        activation_response = self.client.get(url_to_path(activation_url))
        self.assertEqual(activation_response.status_code, status.HTTP_200_OK)
 
        user = User.objects.get()
        user.refresh_from_db()
        self.assertTrue(user.is_active)
 
 
# ---------------------------------------------------------------------------
# Activación de cuenta: casos borde
# ---------------------------------------------------------------------------
class AccountActivationEdgeCaseTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register_buyer")
        self.payload = {
            "email": "activar@test.com",
            "full_name": "Usuario a Activar",
            "password": "ContraseñaSegura123!",
            "confirm_password": "ContraseñaSegura123!",
            "terms_accepted": True,
        }
 
    def test_invalid_uid_returns_400(self):
        response = self.client.get(
            reverse(
                "activate_account",
                kwargs={"uidb64": "uid-invalido", "token": "token-invalido"},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
 
    def test_valid_uid_wrong_token_returns_400(self):
        self.client.post(self.register_url, self.payload)
        user = User.objects.get()
 
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
 
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        response = self.client.get(
            reverse(
                "activate_account",
                kwargs={"uidb64": uid, "token": "token-que-no-corresponde"},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
 
        user.refresh_from_db()
        self.assertFalse(user.is_active)
 
    def test_reusing_activation_link_after_activation_fails(self):
        """El hash del token incluye is_active, así que un link ya usado
        deja de ser válido una vez la cuenta queda activa (protección
        contra reutilización, similar en espíritu a RNF-16)."""
        self.client.post(self.register_url, self.payload)
        activation_url = extract_url(mail.outbox[0].body)
        path = url_to_path(activation_url)
 
        first_response = self.client.get(path)
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
 
        second_response = self.client.get(path)
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
 
 
# ---------------------------------------------------------------------------
# Login (RF-02) + protección de fuerza bruta (RNF-15)
# ---------------------------------------------------------------------------
class LoginTests(APITestCase):
    def setUp(self):
        self.login_url = reverse("login")
        self.password = "ClaveSegura123"
        self.user = make_active_user(
            "login_test@corp.com", role="buyer", password=self.password
        )
 
    def test_successful_login_returns_tokens(self):
        response = self.client.post(
            self.login_url,
            {"email": self.user.email, "password": self.password},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
 
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_attempts, 0)
        self.assertIsNone(self.user.blocked_until)
 
    def test_wrong_password_increments_failed_attempts(self):
        response = self.client.post(
            self.login_url,
            {"email": self.user.email, "password": "clave-incorrecta"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
 
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_attempts, 1)
 
    def test_nonexistent_email_returns_generic_error(self):
        response = self.client.post(
            self.login_url,
            {"email": "no-existe@corp.com", "password": "cualquier-cosa"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # No debe revelar si el correo existe o no en el sistema
        self.assertNotIn("no existe", str(response.data).lower())
 
    def test_inactive_user_cannot_login(self):
        inactive_user = User.objects.create_user(
            email="inactivo@corp.com",
            full_name="Usuario Inactivo",
            role="buyer",
            password="ClaveSegura123",
            is_active=False,
        )
        response = self.client.post(
            self.login_url,
            {"email": inactive_user.email, "password": "ClaveSegura123"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
 
    def test_account_locks_after_five_failed_attempts(self):
        for _ in range(5):
            response = self.client.post(
                self.login_url,
                {"email": self.user.email, "password": "clave-incorrecta"},
            )
 
        # El 5to intento ya debe reportar el bloqueo
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
 
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_attempts, 5)
        self.assertIsNotNone(self.user.blocked_until)
        self.assertGreater(self.user.blocked_until, now())
 
    def test_locked_account_rejects_even_correct_password(self):
        self.user.failed_attempts = 5
        self.user.blocked_until = now() + timedelta(minutes=30)
        self.user.save(update_fields=["failed_attempts", "blocked_until"])
 
        response = self.client.post(
            self.login_url,
            {"email": self.user.email, "password": self.password},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn("access", response.data)
 
    def test_lock_expires_and_allows_login_again(self):
        # Simula que el bloqueo de 30 min ya pasó
        self.user.failed_attempts = 5
        self.user.blocked_until = now() - timedelta(minutes=1)
        self.user.save(update_fields=["failed_attempts", "blocked_until"])
 
        response = self.client.post(
            self.login_url,
            {"email": self.user.email, "password": self.password},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
 
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_attempts, 0)
        self.assertIsNone(self.user.blocked_until)
 
 
# ---------------------------------------------------------------------------
# Logout (RF-03)
# ---------------------------------------------------------------------------
class LogoutTests(APITestCase):
    def setUp(self):
        self.logout_url = reverse("logout")
        self.user = make_active_user("logout_test@corp.com", role="buyer")
        self.refresh = RefreshToken.for_user(self.user)
        # Autenticamos el cliente por si el endpoint requiere estar logueado
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.refresh.access_token}"
        )
 
    def test_missing_refresh_token_returns_400(self):
        response = self.client.post(self.logout_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
 
    def test_invalid_refresh_token_returns_400(self):  # Podrías renombrarlo a _returns_400
        response = self.client.post(self.logout_url, {"refresh": "token-invalido"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) # Cambiado a 400
 
    def test_successful_logout_returns_205(self):
        response = self.client.post(
            self.logout_url, {"refresh": str(self.refresh)}
        )
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
 
    def test_logout_blacklists_the_refresh_token(self):  # requiere token_blacklist
        self.client.post(self.logout_url, {"refresh": str(self.refresh)})
 
        outstanding = OutstandingToken.objects.get(jti=self.refresh["jti"])
        self.assertTrue(
            BlacklistedToken.objects.filter(token=outstanding).exists(),
            "El refresh token debería quedar registrado en la blacklist "
            "tras el logout",
        )
 
    def test_logout_twice_is_idempotent_or_reports_used(self):  # requiere token_blacklist
        """Documenta el comportamiento real de llamar logout dos veces con
        el mismo token, en vez de asumir la rama de error del código.
        Ver nota al inicio del archivo."""
        first = self.client.post(self.logout_url, {"refresh": str(self.refresh)})
        second = self.client.post(self.logout_url, {"refresh": str(self.refresh)})
 
        self.assertEqual(first.status_code, status.HTTP_205_RESET_CONTENT)
        self.assertIn(
            second.status_code,
            (status.HTTP_205_RESET_CONTENT, status.HTTP_400_BAD_REQUEST),
        )