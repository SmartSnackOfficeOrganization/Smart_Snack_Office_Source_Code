from inspect import signature
import logging

from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from urllib3 import request

from .services import verify_rapyd_webhook, process_payment_webhook

from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([])
def payment_callback(request):
    print("=" * 50, flush=True)
    print("=== WEBHOOK RECIBIDO ===", flush=True)
    print(request.method, flush=True)
    print(request.headers, flush=True)
    print(request.body, flush=True)
    
    signature = request.headers.get("signature", "")
    salt = request.headers.get("salt", "")
    timestamp = request.headers.get("timestamp", "")
    body_string = request.body.decode("utf-8")

    full_url = request.build_absolute_uri()

    
    if not verify_rapyd_webhook(full_url, salt, timestamp, body_string, signature):
        print("Firma inválida del webhook", flush=True)
        return Response({"detail": "Firma inválida"}, status=status.HTTP_401_UNAUTHORIZED)

    payload = request.data
    print(f"Payload validado: {payload}", flush=True)
    
    # Procesar el webhook y crear/actualizar el Payment
    result = process_payment_webhook(payload)
    print(f"Resultado: {result}", flush=True)
    
    if result["status"] == "error":
        print(f"Error al procesar webhook: {result['message']}", flush=True)
        return Response(
            {"detail": "Error al procesar pago", "error": result["message"]},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    print(f"Pago procesado correctamente: {result['payment'].rapyd_payment_id}", flush=True)
    return Response({"detail": "ok"}, status=status.HTTP_200_OK)


def payment_complete(request):
    print("Redirect de éxito recibido:", dict(request.GET), flush=True)
    return HttpResponse("Pago completado (placeholder). Aquí conectará con `orders`.")

def payment_error(request):
    print("Redirect de error recibido:", dict(request.GET), flush=True)
    return HttpResponse("Pago no completado (placeholder).", status=200)