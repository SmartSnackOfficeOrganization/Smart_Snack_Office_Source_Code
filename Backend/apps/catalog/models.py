import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.postgres.fields import ArrayField
from django.db import models


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "categories"

    def __str__(self):
        return self.name


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "tags"

    def __str__(self):
        return self.name


class Product(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("suspended", "Suspended"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="products",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    ingredients = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="> 0")
    stock = models.IntegerField(default=0, help_text=">= 0")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    avg_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0, blank=True, null=True
    )
    review_count = models.IntegerField(default=0, blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    tags = models.ManyToManyField(Tag, through="ProductTag", related_name="products")

    class Meta:
        db_table = "products"

    def __str__(self):
        return self.name


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="reviews"
    )
    order = models.ForeignKey(
        "authentication.Order", on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.SmallIntegerField(help_text="1-5")
    comment = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reviews"
        unique_together = (("buyer", "product", "order"),)

    def __str__(self):
        return f"Review {self.rating}/5 by {self.buyer} on {self.product}"


class NutritionFact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.OneToOneField(
        Product, on_delete=models.CASCADE, related_name="nutrition_facts"
    )
    calories = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True
    )
    protein_g = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True
    )
    fat_g = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    carbs_g = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    sugar_g = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    sodium_mg = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True
    )
    serving_size = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "nutrition_facts"


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    url = models.TextField()
    is_primary = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = "product_images"


class ProductTag(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = "product_tags"
        unique_together = (("product", "tag"),)
