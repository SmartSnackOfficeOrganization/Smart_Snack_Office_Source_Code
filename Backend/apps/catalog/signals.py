from django.db.models import Avg, Count
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Product, Review


def _update_product_ratings(product: Product) -> None:
    agg = Review.objects.filter(product=product).aggregate(
        avg=Avg("rating"), count=Count("id")
    )
    avg = agg["avg"] or 0
    cnt = agg["count"] or 0
    Product.objects.filter(id=product.id).update(avg_rating=avg, review_count=cnt)


@receiver(post_save, sender=Review)
def review_post_save(sender, instance, created, **kwargs):
    _update_product_ratings(instance.product)


@receiver(post_delete, sender=Review)
def review_post_delete(sender, instance, **kwargs):
    _update_product_ratings(instance.product)
