from django.conf import settings
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.db import transaction
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import serializers
from urllib.parse import urljoin

from .models import User, BuyerProfile, SellerProfile
from .token import AccountActivationTokenGenetator
from .validators import PasswordValidationMixin, RegistrationValidationMixin


def send_activation_email(user):
    token_generator = AccountActivationTokenGenetator()
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)
    activation_path = reverse(
        "activate_account", kwargs={"uidb64": uid, "token": token}
    )
    activation_link = urljoin(f"{settings.BACKEND_URL.rstrip('/')}/", activation_path)
    send_mail(
        "Activate your user account",
        f"Please click the following link to activate your account.: {activation_link}",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


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
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for login. This serializer is used to validate the user input when logging in.
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
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        if not user.is_active:
            raise serializers.ValidationError("User is not active")
        data["user"] = user
        return data
