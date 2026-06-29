from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.authentication"  # Dónde está la carpeta físicamente
    label = "authentication"  # El nombre que usarás para referenciar esta app en el código (ej: AUTH_USER_MODEL)
