from django.contrib.auth import get_user_model
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    BuyerRegistrationSerializer,
    SellerRegistrationSerializer,
    UserLoginSerializer,
)
from .token import get_tokens_for_user, AccountActivationTokenGenetator
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.throttling import AnonRateThrottle

User = get_user_model()


@api_view(["GET"])
def home(request):
    return Response({"status": "ok"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def register_buyer(request):
    """
    Register a new buyer.
    Creates a User with 'buyer' role and a BuyerProfile.
    """
    serializer = BuyerRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Buyer account created successfully"},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def register_seller(request):
    """
    Register a new seller (RF-16).
    Creates a User with 'seller' role and a SellerProfile.
    """
    serializer = SellerRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Seller account created successfully"},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


"""
Here we are using the UserLoginSerializer to validate the user credentials. 
If the credentials are valid, we generate JWT tokens for the user and return them in the response. 
If the credentials are invalid, we return a 401 Unauthorized response with the serializer errors.
"""


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)
        return Response(status=status.HTTP_200_OK, data=tokens)
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["POST"])
def logout(request):
    try:
        refresh_token = request.data.get("refresh")
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"status": "ok"}, status=status.HTTP_200_OK)
    except TokenError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def activate_account(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and AccountActivationTokenGenetator().check_token(user, token):
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response(
            {"detail": "Account activated successfully"}, status=status.HTTP_200_OK
        )

    return Response(
        {"detail": "Invalid or expired activation link"},
        status=status.HTTP_400_BAD_REQUEST,
    )
