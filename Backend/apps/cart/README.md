# App de Carrito (cart)

## Endpoints

Base path: `/api/cart/`

Requisitos comunes:
- Autenticacion obligatoria (JWT Bearer Token).
- Solo usuarios con `role = "buyer"` pueden usar estos endpoints.

### GET /api/cart/items/
#### * Listar items del carrito

Respuesta exitosa:
- Codigo: `200 OK`
- Body:

```json
{
  "items": [
    {
      "id": "7c93f0ad-6d95-4f0c-b48d-7f24f969f57f",
      "product": {
        "id": "67f6da8c-2b6a-4607-b7f4-26a6f2b1fd8b",
        "name": "Granola premium",
        "price": "12.50",
        "stock": 10,
        "status": "active"
      },
      "quantity": 2
    }
  ],
  "total_items": 2
}
```

Respuestas posibles:
- `200 OK`
- `401 Unauthorized` (sin token o token invalido)
- `403 Forbidden` (usuario autenticado pero no buyer)


### POST /api/cart/items/
#### * Agregar item al carrito

- Body de peticion:

```json
{
  "product_id": "67f6da8c-2b6a-4607-b7f4-26a6f2b1fd8b - ejemplo",
  "quantity": 2
}
```

Notas de comportamiento:
- Si el carrito no existe para el buyer, se crea automaticamente.
- Si el producto ya existe en el carrito, se acumula la cantidad.

Respuesta exitosa:
- Codigo: `201 Created`
- Body (ejemplo):

```json
{
  "id": "7c93f0ad-6d95-4f0c-b48d-7f24f969f57f - ejemplo",
  "product": {
    "id": "67f6da8c-2b6a-4607-b7f4-26a6f2b1fd8b - ejemplo",
    "name": "Granola premium",
    "price": "12.50",
    "stock": 10,
    "status": "active"
  },
  "quantity": 2
}
```

Errores comunes:
- `400 Bad Request`
  - `"Quantity must be greater than or equal to 1."`
  - `"Quantity exceeds available stock."`
- `401 Unauthorized`
- `403 Forbidden`

### 3) Obtener detalle de un item

- Metodo: `GET`
- URL: `/api/cart/items/{id}/`

Respuesta exitosa:
- Codigo: `200 OK`
- Body: mismo formato que un item en create/list.

Respuestas posibles:
- `200 OK`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found` (item inexistente o no pertenece al buyer autenticado)

### 4) Actualizar item completo

- Metodo: `PUT`
- URL: `/api/cart/items/{id}/`
- Body de peticion:

```json
{
  "product_id": "67f6da8c-2b6a-4607-b7f4-26a6f2b1fd8b - ejemplo",
  "quantity": 3
}
```

Respuesta exitosa:
- Codigo: `200 OK`

Errores comunes:
- `400 Bad Request`
  - `"Quantity must be greater than or equal to 1."`
  - `"Quantity exceeds available stock."`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### 5) Actualizar item parcial

- Metodo: `PATCH`
- URL: `/api/cart/items/{id}/`
- Body de peticion (ejemplo):

```json
{
  "quantity": 7
}
```

Respuesta exitosa:
- Codigo: `200 OK`

Errores comunes:
- `400 Bad Request`
  - `"Quantity must be greater than or equal to 1."`
  - `"Quantity exceeds available stock."`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### 6) Eliminar un item

- Metodo: `DELETE`
- URL: `/api/cart/items/{id}/`

Respuesta exitosa:
- Codigo: `204 No Content`
- Body: vacio

Respuestas posibles:
- `204 No Content`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found` (item inexistente o no pertenece al buyer autenticado)

### 7) Vaciar carrito completo

- Metodo: `DELETE`
- URL: `/api/cart/items/clear/`

Respuesta exitosa:
- Codigo: `200 OK`
- Body:

```json
{
  "message": "Cart cleared successfully.",
  "deleted_items": 2
}
```

Respuestas posibles:
- `200 OK`
- `401 Unauthorized`
- `403 Forbidden`

## Comandos de verificacion

Desde la raiz del repo (Con docker activo para el funcionamiento del db):

```bash
docker compose exec backend python manage.py test apps.cart
```

Comandos adicionales utiles:

```bash
docker compose exec backend python manage.py test apps.cart.tests.CartItemAPITests
docker compose exec backend python manage.py test apps.cart.tests.CartItemAPITests.test_clear_cart
```
