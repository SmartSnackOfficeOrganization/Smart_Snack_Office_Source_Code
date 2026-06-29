from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import User
from django.contrib.auth.password_validation import validate_password
import re


class ComplexPasswordValidator:
    """
    Custom password validator.
    """

    def validate(self, password, user=None):
        """Validate password meets complexity requirements"""
        if len(password) < 8:
            raise ValidationError(
                "Password must be at least 8 characters long.",
                code="password_too_short",
            )
        if not re.search(r"[A-Z]", password):
            raise ValidationError(
                "Password must contain at least one uppercase letter.",
                code="password_no_uppercase",
            )
        if not re.search(r"[a-z]", password):
            raise ValidationError(
                "Password must contain at least one lowercase letter.",
                code="password_no_lowercase",
            )
        if not re.search(r"[0-9]", password):
            raise ValidationError(
                "Password must contain at least one digit.",
                code="password_no_digit",
            )

    def get_help_text(self):
        return "Password must contain at least 8 characters, including uppercase, lowercase, and digits."


class PasswordValidationMixin:
    """Reusable password strength + match validation."""

    def validate_passwords(self, password, confirm_password):
        """Validate password strength and matching"""
        if not password or not confirm_password:
            raise serializers.ValidationError(
                {"password": "Both password fields are required."}
            )
        if password != confirm_password:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        # Use Django's validate_password which will use all registered validators including our custom one
        try:
            validate_password(password=password, user=None)
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})


class RegistrationValidationMixin:
    """Reusable validation for registration-specific fields."""

    def validate_email_unique(self, value):
        """Check if email is already registered"""
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use")
        return value

    def validate_terms_accepted(self, value):
        """Validate that terms are accepted"""
        if not value:
            raise serializers.ValidationError("Terms must be accepted")
        return value
