import logging

import requests as requests_lib
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from datetime import timedelta  
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from apps.orders.models import Order

from .models import Payment
from .serializers import InitiateCheckoutSerializer, PaymentStatusSerializer
from .services import build_checkout_page, process_payment_webhook, verify_rapyd_webhook

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([UserRateThrottle])
def initiate_checkout(request):
    serializer = InitiateCheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    order_id = serializer.validated_data["order_id"]
    order = get_object_or_404(Order, id=order_id, buyer=request.user)

    if (
        order.status == "pending_payment"
        and order.stock_reserved_until
        and timezone.now() > order.stock_reserved_until
    ):
        order.mark_as_payment_failed()

    if order.status != "pending_payment":
        return Response(
            {"detail": f"Esta orden no está pendiente de pago (estado actual: {order.status})"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    frontend_url = getattr(settings, "FRONTEND_URL", None)
    complete_url = (
        f"{frontend_url}/payments/confirmacion?reference={order.id}"
        if frontend_url
        else None
    )
    error_url = (
        f"{frontend_url}/payments/error?reference={order.id}" if frontend_url else None
    )

    try:
        result = build_checkout_page(
            reference=str(order.id),
            amount=float(order.total),  
            currency="COP",
            country="CO",
            user_id=request.user.id,
            complete_url=complete_url,
            error_url=error_url,
        )
    except requests_lib.exceptions.RequestException as e:
        logger.exception("Error creando checkout en Rapyd para order_id=%s", order.id)
        error_detail = (
            e.response.text if getattr(e, "response", None) is not None else str(e)
        )
        return Response(
            {"detail": "No se pudo iniciar el pago", "rapyd_error": error_detail},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {"reference": str(order.id), "checkout_url": result["data"]["redirect_url"]},
        status=status.HTTP_201_CREATED,
    )



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def checkout_status(request, reference):
    """
    El frontend hace polling aquí después de que Rapyd redirige al
    comprador de vuelta — el webhook puede no haber llegado todavía.
    De paso, libera reservas de stock expiradas (RF-08): si nadie
    consulta una orden vencida, no se libera sola, pero es un
    trade-off aceptado para el MVP sin Celery.
    """
    order = Order.objects.filter(id=reference).first()
    if (
        order
        and order.status == "pending_payment"
        and order.stock_reserved_until
        and timezone.now() > order.stock_reserved_until
    ):
        order.mark_as_payment_failed()

    payment = (
        Payment.objects.filter(merchant_reference_id=reference)
        .order_by("-created_at")
        .first()
    )

    if not payment:
        return Response({"reference": reference, "status": order.status if order else "pending"})

    if (
        payment.user_id
        and payment.user_id != request.user.id
        and not request.user.is_staff
    ):
        return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    return Response(PaymentStatusSerializer(payment).data)

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([])
def payment_callback(request):
    logger.info("=== WEBHOOK RECIBIDO === method=%s", request.method)

    signature = request.headers.get("signature", "")
    salt = request.headers.get("salt", "")
    timestamp = request.headers.get("timestamp", "")
    body_string = request.body.decode("utf-8")
    full_url = request.build_absolute_uri()

    if not verify_rapyd_webhook(full_url, salt, timestamp, body_string, signature):
        logger.warning("Firma inválida del webhook")
        return Response(
            {"detail": "Firma inválida"}, status=status.HTTP_401_UNAUTHORIZED
        )

    payload = request.data
    result = process_payment_webhook(payload)

    if result["status"] == "error":
        logger.error("Error al procesar webhook: %s", result["message"])
        return Response(
            {"detail": "Error al procesar pago", "error": result["message"]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    logger.info("Pago procesado correctamente: %s", result["payment"].rapyd_payment_id)
    return Response({"detail": "ok"}, status=status.HTTP_200_OK)


def payment_complete(request):
    logger.info("Redirect de éxito recibido: %s", dict(request.GET))
    return HttpResponse("Pago completado (placeholder). Aquí conectará con `orders`.")


def payment_error(request):
    logger.warning("Redirect de error recibido: %s", dict(request.GET))
    return HttpResponse("Pago no completado (placeholder).", status=200)
