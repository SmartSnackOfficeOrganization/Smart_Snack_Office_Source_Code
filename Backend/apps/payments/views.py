import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse

from .services import verify_rapyd_webhook, process_payment_webhook
logger = logging.getLogger(__name__)
from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([])
def payment_callback(request):
    logger.info("=" * 50)
    logger.info("=== WEBHOOK RECIBIDO ===")
    logger.info(f"Method: {request.method}")
    logger.info(f"Headers: {request.headers}")
    logger.info(f"Body: {request.body}")

    signature = request.headers.get("signature", "")
    salt = request.headers.get("salt", "")
    timestamp = request.headers.get("timestamp", "")
    body_string = request.body.decode("utf-8")

    full_url = request.build_absolute_uri()

    
    if not verify_rapyd_webhook(full_url, salt, timestamp, body_string, signature):
        logger.warning("Firma inválida del webhook")
        return Response({"detail": "Firma inválida"}, status=status.HTTP_401_UNAUTHORIZED)

    payload = request.data
    logger.info(f"Payload validado: {payload}")

    # Procesar el webhook y crear/actualizar el Payment
    result = process_payment_webhook(payload)
    logger.info(f"Resultado: {result}")

    if result["status"] == "error":
        logger.error(f"Error al procesar webhook: {result['message']}")
        return Response(
            {"detail": "Error al procesar pago", "error": result["message"]},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    logger.info(f"Pago procesado correctamente: {result['payment'].rapyd_payment_id}")
    return Response({"detail": "ok"}, status=status.HTTP_200_OK)


def payment_complete(request):
    logger.info(f"Redirect de éxito recibido: {dict(request.GET)}")
    return HttpResponse("Pago completado (placeholder). Aquí conectará con `orders`.")

def payment_error(request):
    logger.warning(f"Redirect de error recibido: {dict(request.GET)}")
    return HttpResponse("Pago no completado (placeholder).", status=200)