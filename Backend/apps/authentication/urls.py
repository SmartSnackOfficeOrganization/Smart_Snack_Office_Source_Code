from django.urls import include, path

from . import views

urlpatterns = [
    path("register/buyer/", views.register_buyer, name="register_buyer"),
    path("register/seller/", views.register_seller, name="register_seller"),
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("activate/<uidb64>/<token>/", views.activate_account, name="activate_account"),
    path("password-reset/", views.forgot_password, name="password_reset"),
    path(
        "password-reset/confirm/",
        views.reset_password_confirm,
        name="password_reset_confirm",
    ),
]
