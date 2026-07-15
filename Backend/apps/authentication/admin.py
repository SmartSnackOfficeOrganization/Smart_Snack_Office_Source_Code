from django.contrib import admin

from .models import BuyerProfile, SellerProfile, User


class BuyerProfileInline(admin.StackedInline):
    model = BuyerProfile
    can_delete = False
    verbose_name_plural = "Buyer Profile"
    fields = ("delivery_address", "company_name")


class SellerProfileInline(admin.StackedInline):
    model = SellerProfile
    can_delete = False
    verbose_name_plural = "Seller Profile"
    fields = ("business_name", "tax_info", "commercial_info")


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    model = User
    list_display = (
        "email",
        "full_name",
        "role",
        "is_active",
        "status",
        "is_staff",
        "failed_attempts",
        "created_at",
    )
    list_filter = ("role", "is_active", "status", "is_staff")
    search_fields = ("email", "full_name")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "failed_attempts")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("full_name", "role", "status")}),
        (
            "Security",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "failed_attempts",
                    "blocked_until",
                )
            },
        ),
        ("Terms", {"fields": ("terms_accepted",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "full_name",
                    "role",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )

    def get_inlines(self, request, obj=None):
        if obj is None:
            return []
        if obj.role == "buyer":
            return [BuyerProfileInline]
        if obj.role == "seller":
            return [SellerProfileInline]
        return []


@admin.register(BuyerProfile)
class BuyerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company_name", "delivery_address")
    search_fields = ("user__email", "company_name")


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "business_name")
    search_fields = ("user__email", "business_name")
