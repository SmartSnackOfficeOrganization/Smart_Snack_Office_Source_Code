from datetime import timedelta
from urllib.parse import urljoin

from django.conf import settings
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.db import transaction
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode
from django.utils.timezone import now
from rest_framework import serializers

from .models import BuyerProfile, SellerProfile, User
from .token import AccountActivationTokenGenetator, PasswordResetTokenGenerator
from .validators import PasswordValidationMixin, RegistrationValidationMixin


def send_activation_email(user):
    token_generator = AccountActivationTokenGenetator()
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    activation_link = f"{frontend_url}/activate/{uid}/{token}/"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background-color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">¡Bienvenido a SmartSnack! 🥗</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">
            Gracias por registrarte. Solo falta un paso para activar tu cuenta:
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{activation_link}"
               style="background-color: #16a34a; color: #ffffff; text-decoration: none;
                      padding: 12px 28px; border-radius: 8px; font-weight: bold;
                      display: inline-block;">
                Activar mi cuenta
            </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="{activation_link}" style="color: #16a34a;">{activation_link}</a>
        </p>
    </div>
    """
    plain_message = strip_tags(html_content)

    send_mail(
        "Activa tu cuenta en SmartSnack",
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
        html_message=html_content,
    )
    return activation_link


def get_activation_url(user):
    token_generator = AccountActivationTokenGenetator()
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)
    activation_path = reverse(
        "activate_account", kwargs={"uidb64": uid, "token": token}
    )
    return urljoin(f"{settings.BACKEND_URL.rstrip('/')}/", activation_path)


class BuyerRegistrationSerializer(
    PasswordValidationMixin, RegistrationValidationMixin, serializers.Serializer
):
    """
    Serializer for buyer registration.
    Creates a User with 'buyer' role and a BuyerProfile.
    In this case, we're declaring the fields again as serializers because is not a 1:1 relationship
    We're using the User and Buyerprofile tables
    """

    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=200)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    terms_accepted = serializers.BooleanField()
    delivery_address = serializers.CharField(
        max_length=500, required=False, allow_blank=True
    )
    company_name = serializers.CharField(
        max_length=200, required=False, allow_blank=True
    )

    def validate(self, data):
        """Validate password and terms"""
        password = data.get("password")
        confirm_password = data.get("confirm_password")
        self.validate_passwords(password, confirm_password)
        self.validate_terms_accepted(data.get("terms_accepted"))
        return data

    def validate_email(self, value):
        """Validate email is unique"""
        self.validate_email_unique(value)
        return value

    def create(self, validated_data):
        """Create user and buyer profile"""
        validated_data.pop("confirm_password")
        delivery_address = validated_data.pop("delivery_address", None)
        company_name = validated_data.pop("company_name", None)

        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data["email"],
                full_name=validated_data["full_name"],
                password=validated_data["password"],
                role="buyer",
                is_active=False,
                terms_accepted=validated_data.get("terms_accepted", False),
            )

            BuyerProfile.objects.create(
                user=user, delivery_address=delivery_address, company_name=company_name
            )

        send_activation_email(user)
        self._activation_url = get_activation_url(user)
        return user


class SellerRegistrationSerializer(
    PasswordValidationMixin, RegistrationValidationMixin, serializers.Serializer
):
    """
    Serializer for seller registration.
    Creates a User with 'seller' role and a SellerProfile.
    """

    email = serializers.EmailField()
    full_name = serializers.CharField(
        max_length=200, help_text="Owner name or representative name"
    )
    business_name = serializers.CharField(max_length=200)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    terms_accepted = serializers.BooleanField()
    tax_info = serializers.CharField(max_length=500, required=False, allow_blank=True)
    commercial_info = serializers.CharField(
        max_length=500, required=False, allow_blank=True
    )

    def validate(self, data):
        """Validate password and terms"""
        password = data.get("password")
        confirm_password = data.get("confirm_password")
        self.validate_passwords(password, confirm_password)
        self.validate_terms_accepted(data.get("terms_accepted"))
        return data

    def validate_email(self, value):
        """Validate email is unique"""
        value = self.validate_email_unique(value)
        return value

    def create(self, validated_data):
        """Create user and seller profile"""
        validated_data.pop("confirm_password")
        business_name = validated_data.pop("business_name")
        tax_info = validated_data.pop("tax_info", None)
        commercial_info = validated_data.pop("commercial_info", None)

        # Create user with seller role

        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data["email"],
                full_name=validated_data["full_name"],
                password=validated_data["password"],
                role="seller",
                is_active=False,
                terms_accepted=validated_data.get("terms_accepted", False),
            )

            SellerProfile.objects.create(
                user=user,
                business_name=business_name,
                tax_info=tax_info,
                commercial_info=commercial_info,
            )

        send_activation_email(user)
        self._activation_url = get_activation_url(user)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for login with brute force protection.
    Implements account locking after 5 failed attempts for 30 minutes.

    returns:
        email: ""
        password: ""
        user object
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        # Get user without authenticating first (to check if blocked)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")

        # Check if user is blocked
        if user.blocked_until and user.blocked_until > now():
            remaining_time = (user.blocked_until - now()).total_seconds() / 60
            raise serializers.ValidationError(
                f"Account locked. Try again in {int(remaining_time)} minutes."
            )

        # Reset block if time has passed
        if user.blocked_until and user.blocked_until <= now():
            user.blocked_until = None
            user.failed_attempts = 0
            user.save(update_fields=["blocked_until", "failed_attempts"])

        # Check user is active
        if not user.is_active:
            raise serializers.ValidationError("User is not active")

        # Authenticate with credentials
        authenticated_user = authenticate(email=email, password=password)

        if not authenticated_user:
            # Increment failed attempts
            user.failed_attempts = (user.failed_attempts or 0) + 1

            # Lock account if failed attempts reach limit
            if user.failed_attempts >= 5:
                user.blocked_until = now() + timedelta(minutes=30)
                user.save(update_fields=["failed_attempts", "blocked_until"])
                remaining_time = 30
                raise serializers.ValidationError(
                    f"Account locked due to multiple failed login attempts. Try again in {remaining_time} minutes."
                )
            else:
                user.save(update_fields=["failed_attempts"])
                attempts_left = 5 - user.failed_attempts
                raise serializers.ValidationError(
                    f"Invalid credentials. {attempts_left} attempts remaining."
                )

        # Login successful - reset failed attempts
        user.failed_attempts = 0
        user.blocked_until = None
        user.save(update_fields=["failed_attempts", "blocked_until"])

        data["user"] = authenticated_user
        return data


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        from django.contrib.auth.password_validation import validate_password

        validate_password(value)
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "full_name", "role"]


class BuyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerProfile
        fields = ["delivery_address", "company_name", "allergies"]
