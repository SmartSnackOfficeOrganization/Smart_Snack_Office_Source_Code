from django.conf import settings
from django.db import models
from django.utils import timezone


class Payment(models.Model):
    """
    Modelo para almacenar transacciones de pago desde Rapyd webhook.
    """

    # Estados de pago según Rapyd
    STATUS_CHOICES = [
        ("CLO", "Cerrado/Completado"),
        ("PEN", "Pendiente"),
        ("ERR", "Error"),
        ("REV", "Revertido"),
        ("INIT", "Iniciado"),
        ("CAN", "Cancelado"),
        ("REF", "Reembolsado"),
        ("EXP", "Expirado"),
        ("SUCCESS", "Exitoso"),
        ("ERROR", "Error"),
    ]

    # Relación con Usuario
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
        help_text="Usuario que realizó el pago",
    )

    # Información del pago
    rapyd_payment_id = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="ID único del pago de Rapyd",
    )
    merchant_reference_id = models.CharField(
        max_length=255, db_index=True, help_text="Referencia del pedido/orden"
    )
    customer_token = models.CharField(
        max_length=255, db_index=True, help_text="Token del cliente en Rapyd"
    )

    order = models.ForeignKey(
        "authentication.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
        help_text="Orden asociada si corresponde (UUID)",
    )

    customer_token = models.CharField(
        max_length=255, db_index=True, help_text="Token del cliente en Rapyd"
    )

    # Detalles financieros
    amount = models.DecimalField(
        max_digits=15, decimal_places=2, help_text="Monto del pago"
    )
    original_amount = models.DecimalField(
        max_digits=15, decimal_places=2, help_text="Monto original"
    )
    currency_code = models.CharField(
        max_length=3, default="COP", help_text="Código de moneda (ej: COP, USD)"
    )
    country_code = models.CharField(
        max_length=2, default="CO", help_text="Código del país"
    )

    # Estado del pago
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        db_index=True,
        help_text="Estado actual del pago",
    )
    paid = models.BooleanField(default=False)
    refunded = models.BooleanField(default=False)
    refunded_amount = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, help_text="Monto reembolsado"
    )

    # Método de pago
    payment_method_type = models.CharField(
        max_length=100,
        blank=True,
        help_text="Tipo de método de pago (ej: co_visa_m_card)",
    )
    payment_method_data = models.JSONField(
        null=True, blank=True, help_text="Información completa del método de pago"
    )

    # Códigos y autenticación
    auth_code = models.CharField(
        max_length=100, blank=True, help_text="Código de autorización"
    )
    authentication_result = models.JSONField(
        null=True, blank=True, help_text="Resultado de autenticación 3DS"
    )

    # URLs de redirección
    redirect_url = models.URLField(blank=True, help_text="URL de redirección de Rapyd")
    complete_payment_url = models.URLField(blank=True, help_text="URL de éxito")
    error_payment_url = models.URLField(blank=True, help_text="URL de error")

    # Datos adicionales
    is_partial = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    failure_code = models.CharField(max_length=100, blank=True)
    failure_message = models.TextField(blank=True)

    # Billetera electrónica
    ewallet_id = models.CharField(max_length=255, blank=True)
    ewallets = models.JSONField(null=True, blank=True)

    # Metadata
    webhook_metadata = models.JSONField(
        null=True, blank=True, help_text="Metadata adicional del webhook"
    )

    # Timestamps
    rapyd_created_at = models.DateTimeField(
        help_text="Fecha de creación en Rapyd (convertida de timestamp)"
    )
    rapyd_paid_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha de pago en Rapyd (convertida de timestamp)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["rapyd_payment_id"]),
            models.Index(fields=["merchant_reference_id"]),
            models.Index(fields=["customer_token"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.merchant_reference_id} - {self.amount} {self.currency_code} ({self.status})"
