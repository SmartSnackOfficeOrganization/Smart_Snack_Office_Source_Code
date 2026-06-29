import uuid
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.postgres.fields import ArrayField


class UserManager(BaseUserManager):
    def normalize_email(self, email):
        email = email or ""
        return email.strip().lower()

    def create_user(self, email, full_name, role, password=None, **extra_fields):
        if not email:
            raise ValueError("The email address is mandatory.")
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, full_name, "admin", password, **extra_fields)


class User(AbstractBaseUser):
    ROLE_CHOICES = [
        ("buyer", "Buyer"),
        ("seller", "Seller"),
        ("admin", "Admin"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("blocked", "Blocked"),
        ("suspended", "Suspended"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=255, unique=True)
    # There is no 'password' field here because AbstractBaseUser already has one. We can handle it with set_password() y check_password()
    full_name = models.CharField(max_length=200)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    failed_attempts = models.IntegerField(default=0, blank=True, null=True)
    blocked_until = models.DateTimeField(blank=True, null=True)
    terms_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Campos requeridos por Django admin cuando se extiende AbstractBaseUser
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser

    class Meta:
        db_table = "users"


class BuyerProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="buyer_profile"
    )
    delivery_address = models.TextField(blank=True, null=True)
    company_name = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        db_table = "buyer_profiles"


class SellerProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seller_profile",
    )
    business_name = models.CharField(max_length=200)
    tax_info = models.TextField(blank=True, null=True)
    commercial_info = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "seller_profiles"


class JWTBlacklist(models.Model):
    id = models.BigAutoField(primary_key=True)
    jti = models.CharField(max_length=255, unique=True, help_text="JWT ID revocado")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True
    )
    revoked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "jwt_blacklist"


# ==========================================
# 2. CATÁLOGO DE PRODUCTOS
# ==========================================


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "categories"

    def __str__(self):
        return self.name


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "tags"

    def __str__(self):
        return self.name


class Product(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("suspended", "Suspended"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="products",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    ingredients = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="> 0")
    stock = models.IntegerField(default=0, help_text=">= 0")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    avg_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0, blank=True, null=True
    )
    review_count = models.IntegerField(default=0, blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    tags = models.ManyToManyField(Tag, through="ProductTag", related_name="products")

    class Meta:
        db_table = "products"

    def __str__(self):
        return self.name


class NutritionFact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.OneToOneField(
        Product, on_delete=models.CASCADE, related_name="nutrition_facts"
    )
    calories = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True
    )
    protein_g = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True
    )
    fat_g = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    carbs_g = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    sugar_g = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    sodium_mg = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True
    )
    serving_size = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "nutrition_facts"


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    url = models.TextField()
    is_primary = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = "product_images"


class ProductTag(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = "product_tags"
        unique_together = (("product", "tag"),)


# ==========================================
# 3. COMPRAS, CARRITO Y METAS
# ==========================================


class NutritionalGoal(models.Model):
    NUTRIENT_CHOICES = [
        ("sugar", "Sugar"),
        ("protein", "Protein"),
        ("sodium", "Sodium"),
        ("fat", "Fat"),
        ("calories", "Calories"),
    ]
    UNIT_CHOICES = [("g", "g"), ("mg", "mg"), ("kcal", "kcal")]
    PERIOD_CHOICES = [("daily", "Daily"), ("weekly", "Weekly")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="nutritional_goals",
    )
    nutrient = models.CharField(max_length=50, choices=NUTRIENT_CHOICES)
    target = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "nutritional_goals"


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "carts"


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(help_text=">= 1")
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Precio al momento de añadir"
    )

    class Meta:
        db_table = "cart_items"
        unique_together = (("cart", "product"),)


# ==========================================
# 4. REQUISICIONES, ÓRDENES Y PAGOS
# ==========================================


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending_payment", "Pending Payment"),
        ("paid", "Paid"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders"
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES)
    delivery_address = models.TextField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_id = models.CharField(
        max_length=255, blank=True, null=True, help_text="ID externo pasarela"
    )
    stock_reserved_until = models.DateTimeField(
        blank=True, null=True, help_text="Reserva 15 min"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Precio al momento de compra"
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "order_items"
        unique_together = (("order", "product"),)


class PaymentTransaction(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("rejected", "Rejected"),
        ("refunded", "Refunded"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="transactions"
    )
    gateway_ref = models.CharField(
        max_length=255, blank=True, null=True, help_text="ID en pasarela externa"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES)
    callback_hash = models.CharField(
        max_length=255, blank=True, null=True, help_text="Firma validada del callback"
    )
    processed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payment_transactions"


# ==========================================
# 5. INTERACCIONES, RESEÑAS Y PROMOCIONES
# ==========================================


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    rating = models.SmallIntegerField(help_text="1-5")
    comment = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reviews"
        unique_together = (("buyer", "product", "order"),)


class WishlistItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wishlist_items"
        unique_together = (("buyer", "product"),)


class ProductQuery(models.Model):
    STATUS_CHOICES = [("pending", "Pending"), ("answered", "Answered")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    question = models.TextField()
    answer = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    answered_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_queries"


class Promotion(models.Model):
    TYPE_CHOICES = [
        ("percent", "Percent"),
        ("fixed", "Fixed"),
        ("2x1", "2x1"),
        ("expiry_discount", "Expiry Discount"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="% o monto fijo",
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    products = models.ManyToManyField(
        Product, through="PromotionProduct", related_name="promotions"
    )

    class Meta:
        db_table = "promotions"


class PromotionProduct(models.Model):
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        db_table = "promotion_products"
        unique_together = (("promotion", "product"),)


# ==========================================
# 6. SOPORTE, AUDITORÍA Y DATOS DE IA / RECOMENDACIÓN
# ==========================================


class Claim(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    rejection_reason = models.TextField(blank=True, null=True)
    # ArrayField requiere django.contrib.postgres en INSTALLED_APPS y backend PostgreSQL
    refund_ref = ArrayField(models.CharField(max_length=20), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "claims"


class UserEvent(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event_type = models.CharField(
        max_length=50, help_text="view | search | cart_add | purchase | rating"
    )
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, blank=True, null=True
    )
    metadata = models.JSONField(blank=True, null=True)
    occurred_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "user_events"


class UserPreferenceVector(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    vector = models.JSONField(help_text="Vector item-based CF")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_preference_vectors"


class AnomalyFlag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=30, help_text="price | purchase_pattern")
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, blank=True, null=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True
    )
    detail = models.JSONField(blank=True, null=True)
    resolved = models.BooleanField(default=False)
    flagged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "anomaly_flags"
