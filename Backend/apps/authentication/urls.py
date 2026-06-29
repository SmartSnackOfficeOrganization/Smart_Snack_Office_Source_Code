from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/buyer/', views.register_buyer, name='register_buyer'),
    path('register/seller/', views.register_seller, name='register_seller'),
    path('login/', views.login, name='login'),
    path('activate/<uidb64>/<token>/', views.activate_account, name='activate_account'),
]