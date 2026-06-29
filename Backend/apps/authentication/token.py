from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.serializers import (
    TokenRefreshSerializer,
    TokenVerifySerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import PasswordResetTokenGenerator


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        # Long life token for user
        "refresh": str(refresh),
        # Short token for each request.
        "access": str(refresh.access_token),
    }


def refresh_token(request):
    """
    Refresh the access token using the provided refresh token.
    Custom method (For now we're using the native method)
    """
    serializer = TokenRefreshSerializer(data=request.data)
    if serializer.is_valid():
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def verify_token(request):
    """
    Verify a JWT token and return a success response when it is valid.
    Custom method (For now we're using the native method)
    """
    serializer = TokenVerifySerializer(data=request.data)
    if serializer.is_valid():
        return Response({"detail": "Token is valid"}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AccountActivationTokenGenetator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return str(user.pk) + str(timestamp) + str(user.is_active)
