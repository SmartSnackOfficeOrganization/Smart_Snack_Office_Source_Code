from django.db import transaction
from rest_framework import serializers

from .models import Category, NutritionFact, Product, ProductImage, ProductTag, Tag


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description", "created_at"]
        read_only_fields = ["id", "created_at"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]
        read_only_fields = ["id"]


class NutritionFactSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionFact
        fields = [
            "calories",
            "protein_g",
            "fat_g",
            "carbs_g",
            "sugar_g",
            "sodium_mg",
            "serving_size",
        ]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "url", "is_primary", "sort_order"]
        read_only_fields = ["id"]


class TagsField(serializers.Field):
    def to_internal_value(self, data):
        if not isinstance(data, list):
            raise serializers.ValidationError("Se espera una lista de strings.")
        for item in data:
            if not isinstance(item, str):
                raise serializers.ValidationError("Cada tag debe ser un string.")
        return data

    def to_representation(self, value):
        return [tag.name for tag in value.all()]


class ProductSerializer(serializers.ModelSerializer):
    nutrition_facts = NutritionFactSerializer(required=False, allow_null=True)
    tags = TagsField(required=True)
    images = ProductImageSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        write_only=True, queryset=Category.objects.all(), source="category"
    )
    seller_info = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "seller",
            "seller_info",
            "category",
            "category_id",
            "name",
            "description",
            "ingredients",
            "price",
            "stock",
            "status",
            "avg_rating",
            "review_count",
            "is_featured",
            "nutrition_facts",
            "tags",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "seller",
            "seller_info",
            "avg_rating",
            "review_count",
            "created_at",
            "updated_at",
        ]

    def get_seller_info(self, obj):
        return {"id": str(obj.seller.id), "email": obj.seller.email}

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock can't be less than 0")
        return value

    def create(self, validated_data):
        nutrition_data = validated_data.pop("nutrition_facts", None)
        tags_data = validated_data.pop("tags", [])

        # Validar que el contexto y usuario existan
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "User authentication is required to create a product"
            )

        with transaction.atomic():
            product = Product.objects.create(
                seller=self.context["request"].user, **validated_data
            )
            if nutrition_data:
                NutritionFact.objects.create(product=product, **nutrition_data)

            for tag_name in tags_data:
                tag, _ = Tag.objects.get_or_create(name=tag_name)
                ProductTag.objects.create(product=product, tag=tag)
        return product

    def update(self, instance, validated_data):
        # Pop this fields because model doesn´t receive this specific fields
        nutrition_data = validated_data.pop("nutrition_facts", None)
        tags_data = validated_data.pop("tags", None)

        with transaction.atomic():
            # Update product fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # Update nutrition facts if provided
            if nutrition_data is not None:
                nutrition, _ = NutritionFact.objects.get_or_create(product=instance)
                for attr, value in nutrition_data.items():
                    setattr(nutrition, attr, value)
                nutrition.save()

            # Update tags if provided
            if tags_data is not None:
                ProductTag.objects.filter(product=instance).delete()
                for tag_name in tags_data:
                    tag, _ = Tag.objects.get_or_create(name=tag_name)
                    ProductTag.objects.create(product=instance, tag=tag)

        return instance
