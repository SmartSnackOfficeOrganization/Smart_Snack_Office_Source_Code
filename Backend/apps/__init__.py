"""Contenedor de las apps de Django del backend (una app por servicio).

Este archivo convierte ``apps`` en un paquete regular (en vez de un namespace
package implícito). Sin él, ``apps.__file__`` es ``None`` y el descubrimiento de
pruebas de Django/unittest falla al usar labels (p. ej. ``manage.py test
apps.catalog``) y omite silenciosamente los tests de las sub-apps.
"""
