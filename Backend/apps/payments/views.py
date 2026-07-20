from inspect import signature

from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from urllib3 import request
# Create your views here.

from .services import verify_rapyd_webhook


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
    # lógica de negocio (pendiente hasta que exista `orders`)
    return Response({"detail": "ok"}, status=status.HTTP_200_OK)



def payment_complete(request):
    print("Redirect de éxito recibido:", dict(request.GET))
    return HttpResponse("Pago completado (placeholder). Aquí conectará con `orders`.")

def payment_error(request):
    print("Redirect de error recibido:", dict(request.GET))
    return HttpResponse("Pago no completado (placeholder).", status=200)