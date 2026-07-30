from urllib.parse import urljoin

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.decorators import (api_view, permission_classes,
                                       throttle_classes)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (BuyerProfileSerializer, BuyerRegistrationSerializer,
                          ForgotPasswordSerializer,
                          ResetPasswordConfirmSerializer,
                          SellerRegistrationSerializer, UserLoginSerializer,
                          UserProfileSerializer)
from .token import (AccountActivationTokenGenetator,
                    PasswordResetTokenGenerator, get_tokens_for_user)

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
        response_data = {"message": "Buyer account created successfully"}
        if settings.DEBUG:
            response_data["activation_url"] = getattr(
                serializer, "_activation_url", None
            )
        return Response(response_data, status=status.HTTP_201_CREATED)
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
            {
                "message": "Seller account created successfully",
                "activation_url": getattr(serializer, "_activation_url", None),
            },
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
        tokens["role"] = user.role
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
@throttle_classes([])
@permission_classes([AllowAny])
def activate_account(request, uidb64, token):
    try:
        # Here we must send the uid enconded for email verification (code)
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


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            user = None

        if user is not None:
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            frontend_url = settings.FRONTEND_URL.rstrip("/")
            reset_url = f"{frontend_url}/reset-password/{uid}/{token}/"
            send_mail(
                "Restablece tu contraseña",
                f"Usa este enlace para restablecer tu contraseña: {reset_url}",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            response_data = {
                "message": "Si el correo es válido, se envió un enlace de recuperación."
            }
            if settings.DEBUG:
                response_data["reset_url"] = reset_url
            return Response(response_data, status=status.HTTP_200_OK)

        return Response(
            {"message": "Si el correo es válido, se envió un enlace de recuperación."},
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def reset_password_confirm(request):
    serializer = ResetPasswordConfirmSerializer(data=request.data)
    if serializer.is_valid():
        uidb64 = serializer.validated_data["uidb64"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is None:
            return Response(
                {"error": "token_invalid"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response(
                {"error": "token_expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response(
            {"message": "Contraseña actualizada correctamente."},
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH"])
@throttle_classes([UserRateThrottle])
def manage_profile(request):
    user = request.user
    if user.role == "buyer":
        profile = getattr(user, "buyer_profile", None)
    else:
        return Response(
            {"detail": "Solo los compradores tienen perfil de alergias."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        user_data = UserProfileSerializer(user).data
        profile_data = BuyerProfileSerializer(profile).data if profile else {}
        return Response({**user_data, **profile_data})

    serializer = BuyerProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        user_data = UserProfileSerializer(user).data
        profile_data = BuyerProfileSerializer(profile).data
        return Response({**user_data, **profile_data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
