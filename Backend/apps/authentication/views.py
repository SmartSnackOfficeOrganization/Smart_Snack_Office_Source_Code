from django.contrib.auth import get_user_model
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    BuyerRegistrationSerializer,
    SellerRegistrationSerializer,
    UserLoginSerializer,
)
from .token import AccountActivationTokenGenetator, get_tokens_for_user

User = get_user_model()


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
@throttle_classes([AnonRateThrottle])
def register_seller(request):
    """
    Register a new seller.
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


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([UserRateThrottle])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)
        return Response(status=status.HTTP_200_OK, data=tokens)
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["POST"])
@throttle_classes([UserRateThrottle])
def logout(request):
    """
    Logout endpoint that blacklists the provided refresh token.
    Requires a refresh token in the request body.
    """
    refresh_token = request.data.get("refresh")

    # Check if refresh token is provided
    if not refresh_token:
        return Response(
            {"detail": "Refresh token is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(
            {
                "detail": "Successfully logged out",
                "message": "Your session has been terminated",
            },
            status=status.HTTP_205_RESET_CONTENT,
        )
    except TokenError as e:
        error_message = str(e)
        if "token is invalid or expired" in error_message.lower():
            return Response(
                {"detail": "Token is invalid or expired"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        elif "blacklist" in error_message.lower():
            return Response(
                {"detail": "Token has already been blacklisted"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        else:
            return Response(
                {"detail": "Logout failed. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except Exception as e:
        return Response(
            {"detail": "An unexpected error occurred during logout"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


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
