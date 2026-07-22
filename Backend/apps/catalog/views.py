import django_filters
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny

from .models import Category, Product, ProductImage, Tag
from .permissions import IsProductOwner, IsSeller
from .serializers import CategorySerializer, ProductImageSerializer, ProductSerializer, TagSerializer


class ProductFilter(django_filters.FilterSet):
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    tags = django_filters.CharFilter(method="filter_by_tags")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = ["category"]

    def filter_by_tags(self, queryset, name, value):
        tag_names = value.split(",")
        return queryset.filter(tags__name__in=tag_names).distinct()

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset.filter(stock=0)


class ProductsViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    # Ordering configuration on global config
    filterset_class = ProductFilter
    filter_backends = [OrderingFilter, DjangoFilterBackend]

    ordering_fields = ["price", "created_at", "review_count"]
    ordering = ["-created_at", "-review_count"]

    def get_queryset(self):
        qs = Product.objects.select_related(
            "category", "nutrition_facts", "seller"
        ).prefetch_related("tags", "images")
        user = self.request.user
        # El vendedor ve lo suyo (aunque esté suspendido); el resto, solo activos
        # (regla de negocio 9 / RF-29).
        if user.is_authenticated and getattr(user, "role", None) == "seller":
            return qs.filter(Q(status="active") | Q(seller=user))
        return qs.filter(status="active")

    def get_permissions(self):
        if self.action == "create":
            return [IsSeller()]
        if (
            self.action == "update"
            or self.action == "partial_update"
            or self.action == "destroy"
        ):
            return [IsSeller(), IsProductOwner()]
        else:
            return []

    def perform_create(self, serializer):
        serializer.save()


class ProductImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing product images. Only the owner of the product can add, update, or delete images."""

    serializer_class = ProductImageSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsSeller(), IsProductOwner()]
        else:
            return []

    def get_queryset(self):
        # kwargs contain the product_id from the URL pattern and we filter images by that product_id
        product_id = self.kwargs.get("product_id")
        return ProductImage.objects.filter(product_id=product_id)

    def perform_create(self, serializer):
        try:
            product_id = self.kwargs.get("product_id")
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise NotFound("Product not found")
        # Validate that the product belongs to the current user before saving the image
        if product.seller != self.request.user:
            raise PermissionDenied("You can only upload images for your own products")
        serializer.save(product=product)

    def perform_update(self, serializer):
        if serializer.instance.product.seller != self.request.user:
            raise PermissionDenied("You can only update images for your own products")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.product.seller != self.request.user:
            raise PermissionDenied("You can only delete images for your own products")
        instance.delete()


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None
    permission_classes = [AllowAny]


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    pagination_class = None
    permission_classes = [AllowAny]
