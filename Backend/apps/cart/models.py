from django.db import models
import uuid
from django.conf import settings
from apps.catalog.models import Product


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "carts"
    

class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(help_text=">= 1")
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Price of the product at the time it was added to the cart"
    )

    class Meta:
        db_table = "cart_items"
        unique_together = (("cart", "product"),)
