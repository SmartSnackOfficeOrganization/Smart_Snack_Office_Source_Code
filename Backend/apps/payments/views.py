from inspect import signature

from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from urllib3 import request

from .services import verify_rapyd_webhook, process_payment_webhook


@api_view(["POST"])
@permission_classes([AllowAny])
def payment_callback(request):
    signature = request.headers.get("signature", "")
    salt = request.headers.get("salt", "")
    timestamp = request.headers.get("timestamp", "")
    body_string = request.body.decode("utf-8")

    full_url = request.build_absolute_uri()

    
    if not verify_rapyd_webhook(full_url, salt, timestamp, body_string, signature):
        return Response({"detail": "Firma inválida"}, status=status.HTTP_401_UNAUTHORIZED)

    payload = request.data
    print("Webhook recibido de Rapyd:", payload, flush=True)
    
    # Procesar el webhook y crear/actualizar el Payment
    result = process_payment_webhook(payload)
    
    if result["status"] == "error":
        print(f"Error al procesar webhook: {result['message']}", flush=True)
        return Response(
            {"detail": "Error al procesar pago", "error": result["message"]},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    print(f"Pago procesado correctamente: {result['payment'].rapyd_payment_id}", flush=True)
    return Response({"detail": "ok"}, status=status.HTTP_200_OK)



def payment_complete(request):
    print("Redirect de éxito recibido:", dict(request.GET))
    return HttpResponse("Pago completado (placeholder). Aquí conectará con `orders`.")

def payment_error(request):
    print("Redirect de error recibido:", dict(request.GET))
    return HttpResponse("Pago no completado (placeholder).", status=200)