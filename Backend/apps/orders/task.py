# apps/orders/tasks.py (nuevo archivo)
from celery import shared_task
from django.utils import timezone

from .models import Order


@shared_task
def release_expired_reservations():
    expired = Order.objects.filter(
        status="pending_payment",
        stock_reserved_until__lt=timezone.now(),
    )
    count = 0
    for order in expired:
        order.mark_as_payment_failed()  # reutiliza la misma lógica de liberación
        count += 1
    return f"{count} órdenes expiradas liberadas"
