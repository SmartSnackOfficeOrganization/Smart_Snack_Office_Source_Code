from decimal import Decimal

from rest_framework import serializers

from .models import Payment


from rest_framework import serializers
from .models import Payment


class InitiateCheckoutSerializer(serializers.Serializer):
    """
    Ya no recibe amount/currency/country del cliente — solo el pedido
    a pagar. El monto y la moneda salen del Order en el servidor.
    """
    order_id = serializers.UUIDField()


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