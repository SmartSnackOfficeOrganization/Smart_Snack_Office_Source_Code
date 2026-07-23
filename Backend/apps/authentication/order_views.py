import io

from django.http import HttpResponse

from django.db.models import Prefetch
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order, OrderItem
from .pdf_utils import generate_shipping_labels_pdf
from .serializers import OrderSerializer


class IsSeller(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "seller"


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsSeller]

    def get_queryset(self):
        user = self.request.user
        return (
            Order.objects.filter(items__seller=user)
            .prefetch_related(
                Prefetch("items", queryset=OrderItem.objects.filter(seller=user))
            )
            .select_related("buyer__buyer_profile")
            .distinct()
        )

    def list(self, request, *args, **kwargs):
        status_filter = request.query_params.get("status")
        queryset = self.get_queryset()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="shipping-labels")
    def shipping_labels(self, request):
        order_ids = request.query_params.getlist("order_ids")
        if not order_ids:
            return Response(
                {"detail": "Debes especificar al menos un order_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        orders = (
            Order.objects.filter(id__in=order_ids, items__seller=user)
            .prefetch_related(
                Prefetch("items", queryset=OrderItem.objects.filter(seller=user))
            )
            .select_related("buyer__buyer_profile")
            .distinct()
        )

        if not orders.exists():
            return Response(
                {"detail": "No se encontraron órdenes para los IDs proporcionados."},
                status=status.HTTP_404_NOT_FOUND,
            )

        pdf_buffer = generate_shipping_labels_pdf(orders)
        return HttpResponse(
            pdf_buffer.getvalue(),
            content_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=etiquetas_envio.pdf",
            },
        )
