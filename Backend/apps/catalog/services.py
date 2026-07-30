from django.db import transaction

from .models import NutritionFact, Product, ProductTag, Tag


def create_product(
    *,
    seller,
    name,
    price,
    category=None,
    description=None,
    ingredients=None,
    stock=0,
    status="active",
    is_featured=False,
    tags=None,
    nutrition_facts=None,
) -> Product:
    """
    Create a product with optional nutrition facts and tags.
    Mirrors ProductSerializer.create without requiring an HTTP request.
    """
    tags = tags or []
    with transaction.atomic():
        product = Product.objects.create(
            seller=seller,
            category=category,
            name=name,
            description=description,
            ingredients=ingredients,
            price=price,
            stock=stock,
            status=status,
            is_featured=is_featured,
        )
        if nutrition_facts:
            NutritionFact.objects.create(product=product, **nutrition_facts)

        for tag_name in tags:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            ProductTag.objects.create(product=product, tag=tag)

    return product
