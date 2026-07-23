from django.urls import path

from . import views

urlpatterns = [
    path("checkout/", views.initiate_checkout, name="initiate_checkout"),
    path("status/<str:reference>/", views.checkout_status, name="checkout_status"),
    path("complete/", views.payment_complete, name="payment_complete"),
    path("error/", views.payment_error, name="payment_error"),
    path("callback/", views.payment_callback, name="payment_callback"),
]
