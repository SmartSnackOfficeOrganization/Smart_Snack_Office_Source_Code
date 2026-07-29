from django.db import transaction
from rest_framework import serializers

from apps.catalog.allergies import matching_allergens
from apps.catalog.models import Product
from apps.catalog.serializers import ProductSerializer

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        write_only=True, queryset=Product.objects.all(), source="product"
    )

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_id", "quantity"]
        read_only_fields = ["id"]

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Quantity must be greater than or equal to 1."
            )
        return value

    def create(self, validated_data):
        cart = self.context["cart"]
        product = validated_data["product"]
        quantity = validated_data["quantity"]

        with transaction.atomic():
            # Lock cart row to avoid duplicate cart-product writes in concurrent requests.
            Cart.objects.select_for_update().get(pk=cart.pk)

            existing_item = (
                CartItem.objects.select_for_update()
                .filter(cart=cart, product=product)
                .first()
            )
            if existing_item:
                new_quantity = existing_item.quantity + quantity
                if new_quantity > product.stock:
                    raise serializers.ValidationError(
                        "Quantity exceeds available stock."
                    )
                existing_item.quantity = new_quantity
                existing_item.unit_price = product.price
                existing_item.save(update_fields=["quantity", "unit_price"])
                return existing_item

            if quantity > product.stock:
                raise serializers.ValidationError("Quantity exceeds available stock.")

            return CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity,
                unit_price=product.price,
            )

    def update(self, instance, validated_data):
        quantity = validated_data.get("quantity", instance.quantity)
        if quantity > instance.product.stock:
            raise serializers.ValidationError("Quantity exceeds available stock.")

        instance.quantity = quantity
        instance.unit_price = instance.product.price
        instance.save(update_fields=["quantity", "unit_price"])
        return instance

    def validate(self, data):
        product = data.get("product") or (
            self.instance.product if self.instance else None
        )
        quantity = data.get("quantity")

        if product and quantity is not None and quantity > product.stock:
            raise serializers.ValidationError("Quantity exceeds available stock.")

        if (
            self.instance is None
            and product
            and quantity is not None
            and self.context.get("cart")
        ):
            buyer = self.context["request"].user
            profile = getattr(buyer, "buyer_profile", None)
            if profile and profile.allergies:
                product_tags = list(product.tags.values_list("name", flat=True))
                matched = matching_allergens(profile.allergies, product_tags)
                if matched:
                    raise serializers.ValidationError(
                        {
                            "detail": "No se puede agregar este producto. Contiene alérgenos que están en tus restricciones.",
                            "allergens": matched,
                        }
                    )

            existing_quantity = (
                CartItem.objects.filter(cart=self.context["cart"], product=product)
                .values_list("quantity", flat=True)
                .first()
                or 0
            )
            if existing_quantity + quantity > product.stock:
                raise serializers.ValidationError("Quantity exceeds available stock.")

        return data
