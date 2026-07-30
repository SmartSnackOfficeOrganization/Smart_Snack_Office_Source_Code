from apps.orders.models import Order, OrderItem
from rest_framework import serializers


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "unit_price",
            "subtotal",
            "seller",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source="buyer.full_name", read_only=True)
    buyer_company = serializers.CharField(
        source="buyer.buyer_profile.company_name", read_only=True
    )
    buyer_address = serializers.CharField(
        source="buyer.buyer_profile.delivery_address", read_only=True
    )
    reviewed_product_ids = serializers.SerializerMethodField()

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
            "reviewed_product_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "buyer"]

    def get_reviewed_product_ids(self, obj):
        user = self.context.get("request").user if self.context.get("request") else None
        if not user or not user.is_authenticated:
            return []
        from apps.catalog.models import Review

        return list(
            Review.objects.filter(order=obj, buyer=user).values_list(
                "product_id", flat=True
            )
        )


class UpdateStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["shipped", "delivered"])

    def validate_status(self, value):
        order = self.context.get("order")
        if not order:
            return value
        valid = {"paid": ["shipped"], "shipped": ["delivered"]}
        allowed = valid.get(order.status, [])
        if value not in allowed:
            raise serializers.ValidationError(
                f"No se puede cambiar de '{order.status}' a '{value}'."
            )
        return value
