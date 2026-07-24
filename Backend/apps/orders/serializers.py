from rest_framework import serializers

from apps.authentication.models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product_name", "quantity", "unit_price", "subtotal", "seller"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source="buyer.full_name", read_only=True)
    buyer_company = serializers.CharField(
        source="buyer.buyer_profile.company_name", read_only=True
    )
    buyer_address = serializers.CharField(
        source="buyer.buyer_profile.delivery_address", read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "buyer",
            "buyer_name",
            "buyer_company",
            "buyer_address",
            "status",
            "delivery_address",
            "subtotal",
            "tax",
            "total",
            "transaction_id",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "buyer"]
