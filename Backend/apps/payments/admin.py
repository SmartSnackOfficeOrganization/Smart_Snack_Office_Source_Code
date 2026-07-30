from django.contrib import admin
from django.utils.html import format_html

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    Admin personalizado para visualizar y gestionar transacciones de pago.
    """

    list_display = (
        "merchant_reference_id",
        "rapyd_payment_id_short",
        "user_display",
        "amount_display",
        "status_badge",
        "paid",
        "refunded",
        "created_at",
    )

    list_filter = (
        "status",
        "paid",
        "refunded",
        "currency_code",
        "country_code",
        "payment_method_type",
        "user",
        "created_at",
        "rapyd_created_at",
    )

    search_fields = (
        "rapyd_payment_id",
        "merchant_reference_id",
        "customer_token",
        "auth_code",
    )

    readonly_fields = (
        "rapyd_payment_id",
        "customer_token",
        "payment_method_data_display",
        "authentication_result_display",
        "webhook_metadata_display",
        "ewallets_display",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Información General",
            {
                "fields": (
                    "user",
                    "merchant_reference_id",
                    "rapyd_payment_id",
                    "customer_token",
                    "status",
                )
            },
        ),
        (
            "Detalles Financieros",
            {
                "fields": (
                    "amount",
                    "original_amount",
                    "currency_code",
                    "country_code",
                    "refunded",
                    "refunded_amount",
                )
            },
        ),
        (
            "Estado del Pago",
            {
                "fields": (
                    "paid",
                    "rapyd_created_at",
                    "rapyd_paid_at",
                )
            },
        ),
        (
            "Método de Pago",
            {
                "fields": (
                    "payment_method_type",
                    "payment_method_data_display",
                    "auth_code",
                    "authentication_result_display",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "URLs de Redirección",
            {
                "fields": (
                    "redirect_url",
                    "complete_payment_url",
                    "error_payment_url",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Información Adicional",
            {
                "fields": (
                    "is_partial",
                    "description",
                    "failure_code",
                    "failure_message",
                    "ewallet_id",
                    "ewallets_display",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("webhook_metadata_display",),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps del Sistema",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    ordering = ("-created_at",)
    date_hierarchy = "created_at"
    actions = ["mark_as_reviewed"]

    def rapyd_payment_id_short(self, obj):
        """Muestra solo los últimos 12 caracteres del ID de pago"""
        return obj.rapyd_payment_id[-12:] if obj.rapyd_payment_id else "-"

    rapyd_payment_id_short.short_description = "Pago ID"

    def user_display(self, obj):
        """Muestra el usuario"""
        if obj.user:
            return f"{obj.user.full_name} ({obj.user.email})"
        return "Sin usuario"

    def amount_display(self, obj):
        """Muestra el monto con formato"""
        return f"{obj.amount:,.2f} {obj.currency_code}"

    amount_display.short_description = "Monto"

    def status_badge(self, obj):
        """Muestra el estado con colores"""
        status_colors = {
            "CLO": "#28a745",  # Verde
            "PEN": "#ffc107",  # Amarillo
            "ERR": "#dc3545",  # Rojo
            "REV": "#6c757d",  # Gris
            "INIT": "#0dcaf0",  # Azul
        }
        color = status_colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Estado"

    def payment_method_data_display(self, obj):
        """Muestra payment_method_data formateado"""
        if not obj.payment_method_data:
            return "-"

        data = obj.payment_method_data
        display_fields = [
            ("Tipo", data.get("type")),
            ("Últimos 4 dígitos", data.get("last4")),
            ("Marca", data.get("bin_details", {}).get("brand")),
            ("Banco Emisor", data.get("bin_details", {}).get("issuer")),
            ("Verificación CVV", data.get("cvv_check")),
            ("Verificación ACS", data.get("acs_check")),
        ]

        html_parts = []
        for label, value in display_fields:
            if value:
                html_parts.append(f"<li><strong>{label}:</strong> {value}</li>")

        return (
            format_html(
                "<ul style='margin: 0; padding-left: 20px;'>{}</ul>",
                "".join(html_parts),
            )
            if html_parts
            else "-"
        )

    payment_method_data_display.short_description = "Datos de Método de Pago"

    def authentication_result_display(self, obj):
        """Muestra el resultado de autenticación 3DS"""
        if not obj.authentication_result:
            return "-"

        auth = obj.authentication_result
        display_fields = [
            ("ECI", auth.get("eci")),
            ("Resultado", auth.get("result")),
            ("Versión", auth.get("version")),
        ]

        html_parts = []
        for label, value in display_fields:
            if value:
                html_parts.append(f"<li><strong>{label}:</strong> {value}</li>")

        return (
            format_html(
                "<ul style='margin: 0; padding-left: 20px;'>{}</ul>",
                "".join(html_parts),
            )
            if html_parts
            else "-"
        )

    authentication_result_display.short_description = "Resultado de Autenticación"

    def ewallets_display(self, obj):
        """Muestra información de billeteras"""
        if not obj.ewallets:
            return "-"

        html_parts = []
        for wallet in obj.ewallets:
            html_parts.append(
                f"<li>ID: {wallet.get('ewallet_id')} | "
                f"Monto: {wallet.get('amount')} | "
                f"Porcentaje: {wallet.get('percent')}%</li>"
            )

        return (
            format_html(
                "<ul style='margin: 0; padding-left: 20px;'>{}</ul>",
                "".join(html_parts),
            )
            if html_parts
            else "-"
        )

    ewallets_display.short_description = "Billeteras"

    def webhook_metadata_display(self, obj):
        """Muestra metadata del webhook"""
        if not obj.webhook_metadata:
            return "-"

        import json

        return format_html(
            "<pre style='background: #f5f5f5; padding: 10px; border-radius: 3px; "
            "max-height: 300px; overflow-y: auto;'>{}</pre>",
            json.dumps(obj.webhook_metadata, indent=2, ensure_ascii=False),
        )

    webhook_metadata_display.short_description = "Metadata"

    def mark_as_reviewed(self, request, queryset):
        """Acción personalizada para marcar como revisado (placeholder)"""
        count = queryset.count()
        self.message_user(request, f"{count} pagos revisados.")

    mark_as_reviewed.short_description = "Marcar como revisado"

    def has_add_permission(self, request):
        """Evitar que se creen pagos manualmente en el admin"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Permitir eliminar solo superusuarios"""
        return request.user.is_superuser
