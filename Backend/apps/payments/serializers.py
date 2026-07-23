from decimal import Decimal

from rest_framework import serializers

from .models import Payment


class InitiateCheckoutSerializer(serializers.Serializer):
    """
    Valida los datos de entrada para iniciar un checkout.
    recibe el monto directamente; cuando exista `orders` modificar`.
    """

    amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, min_value=Decimal("0.01")
    )
    currency = serializers.CharField(max_length=3, default="COP")
    country = serializers.CharField(max_length=2, default="CO")
    reference = serializers.CharField(max_length=255, required=False, allow_blank=False)


class PaymentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "merchant_reference_id",
            "status",
            "paid",
            "amount",
            "currency_code",
            "failure_message",
            "created_at",
        ]