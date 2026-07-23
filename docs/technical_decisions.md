- No se va a desplegar, no es necesario para la entrega.

- Debemos testear las feats antes de mergear, obviamente que funcionen bien.

- Aplicar formato "black e isort con docker exec smartsnack_backend black ." y "docker exec smartsnack_backend isort ." para facilitar la lectura del código.

- Comentar el código.

- Main y develop no están protegidas, pero siempre verificar que estamos trabajando en la rama correcta para evitar errores.

## Integración de pasarela de pagos (Rapyd + ngrok)

### Por qué Rapyd

Se evaluó Wompi primero, pero exige verificación de comercio real
antes de dar acceso al dashboard — un bloqueo no viable para un
proyecto académico. Rapyd ofrece un ambiente sandbox self-service,
sin verificación de negocio, con la misma especificación de API que
producción.

### Resumen del flujo (server-to-server vs. navegador)

Hay dos mecanismos distintos que **no** dependen el uno del otro:

- **Redirección del navegador** (`complete_payment_url` /
  `error_payment_url`): el propio navegador del comprador navega ahí
  después de pagar. No requiere ngrok — el navegador del usuario
  siempre puede llegar a `localhost` en su propia máquina.
- **Webhook** (`/api/payments/callback/`): los servidores de Rapyd
  llaman a tu backend directamente. Esto **sí** requiere que el
  `localhost` sea alcanzable desde internet — de ahí la necesidad de
  ngrok en desarrollo.

---

### Paso 1 — Instalar y configurar ngrok

1. Crea una cuenta en <https://dashboard.ngrok.com/signup>.
2. Instala el agente de ngrok para tu sistema operativo (ver
   instrucciones específicas en el dashboard tras crear la cuenta).
3. Agrega tu authtoken personal (cada integrante del equipo usa el
   **suyo propio** — no se comparte, es una cuenta individual):
   ```bash
   ngrok config add-authtoken TU_AUTHTOKEN
   ```
4. Levanta el túnel hacia el backend (puerto `8000` por defecto en
   este proyecto):
   ```bash
   ngrok http 8000
   ```
   **Recomendado**: en vez del comando anterior, usa tu *dev domain*
   fijo (asignado automáticamente a tu cuenta gratuita de ngrok, no
   cambia entre sesiones — evita tener que reconfigurar el webhook en
   Rapyd cada vez que reinicies ngrok):
   ```bash
   ngrok http --url=TU_DOMINIO_FIJO.ngrok-free.dev 8000
   ```
   Encuentra tu dev domain en el dashboard de ngrok, bajo
   **Gateway → Domains**.
5. Copia la URL pública que te asigna (`https://xxxx.ngrok-free.dev`)
   — la necesitas en los pasos siguientes.

### Paso 2 — Configurar `ALLOWED_HOSTS`

Django rechaza con `400 Bad Request` cualquier petición cuyo header
`Host` no esté en `ALLOWED_HOSTS` — y ngrok reenvía las peticiones con
su propio dominio como `Host`, no con `localhost`.

En `.env`:
```dotenv
ALLOWED_HOSTS=localhost,127.0.0.1,TU_DOMINIO.ngrok-free.dev
```

Reinicia el contenedor del backend después de este cambio:
```bash
docker compose restart backend
```

### Paso 3 — Cuenta y llaves de Rapyd

1. Crea una cuenta de desarrollador en
   <https://dashboard.rapyd.net/sign-up>.
2. Confirma que el **modo Sandbox** esté activo (barra rosa visible en
   la parte superior del dashboard).
3. Obtén tu `access_key` y `secret_key` de sandbox en
   <https://dashboard.rapyd.net/developers/api-control>.

   > **Nota de equipo**: estas llaves representan la cuenta de
   > comercio del proyecto, no una cuenta personal — a diferencia del
   > authtoken de ngrok, aquí **sí** conviene que todo el equipo use
   > el mismo par de llaves , para que
   > todos vean las mismas transacciones de prueba en el mismo
   > dashboard.

4. Registra el webhook en
   <https://dashboard.rapyd.net/developers/webhooks/management>:
   - **URL**: tu dominio de ngrok + el path exacto, con `https://` y
     el trailing slash final:
     ```
     https://TU_DOMINIO.ngrok-free.dev/api/payments/callback/
     ```
   - **Eventos**: marca al menos `PAYMENT_COMPLETED` (y
     `PAYMENT_FAILED` si tu dashboard lo ofrece, para cubrir también
     el camino de rechazo).

   ⚠️ La URL debe coincidir carácter por carácter con la ruta real de
   tu backend — Rapyd firma sus webhooks usando la URL completa como
   parte del cálculo de la firma, así que un trailing slash de más o
   de menos invalida la verificación.

### Paso 4 — Variables de entorno

Agrega esto a tu `.env` :

```dotenv
RAPYD_ACCESS_KEY=rak_47D599FA76514396F519
RAPYD_SECRET_KEY=rsk_da4762f59d9c5ee25ee298009a41248ede6ff22bba90c9deb1cf529dff4459617c75a479fcf6e11c
RAPYD_BASE_URL=https://sandboxapi.rapyd.net
BACKEND_URL=https://TU_DOMINIO.ngrok-free.dev
```

⚠️ **No uses comillas** alrededor de los valores. Docker Compose lee
`.env` de forma literal (a diferencia de `python-dotenv`) — unas
comillas puestas "para que se vea más claro" terminan siendo parte
del valor real de la variable, y `settings.RAPYD_ACCESS_KEY` incluiría
esas comillas, rompiendo la firma de cada request sin ningún mensaje
de error obvio.

Reconstruye el contenedor tras el cambio:
```bash
docker compose build backend
docker compose up -d
```

### Paso 5 — Verificar que todo quedó bien conectado

```bash
# Confirma que las variables llegaron al contenedor
docker exec -it smartsnack_backend python manage.py shell -c "
from django.conf import settings
print(repr(settings.RAPYD_ACCESS_KEY))
print(repr(settings.RAPYD_SECRET_KEY))
"

# Corre las migraciones del modelo Payment
docker exec -it smartsnack_backend python manage.py migrate

# Prueba el flujo completo con un usuario mock (crea el checkout,
# no requiere que exista la app `orders` todavía)
docker exec -it smartsnack_backend python manage.py test_initiate_checkout
```

Si el último comando imprime una `checkout_url`, ábrela en el
navegador, completa el pago con una tarjeta de prueba, y confirma en
la terminal de ngrok que la petición al webhook devuelve `200 OK`.

### Datos de tarjeta para pruebas

Consulta la página oficial y vigente antes de tu prueba (los números
pueden cambiar):
Numbers for Successful Transactions

You can use any card number that you find in the examples for the API methods, including the following card numbers:

4111111111111111

4462030000000000

Numbers for Error Transactions

Use the following card numbers in the sandbox to simulate rejection of a card payment:

4111111111111105 Do Not Honor.

4111111111111143 Stolen Card, pick up.

4111111111111151 Insufficient Funds.

<https://docs.rapyd.net/en/card-numbers-for-testing.html>

### Problemas comunes (troubleshooting)

| Síntoma | Causa probable |
|---|---|
| `400 Bad Request` al llegar el webhook | Falta el dominio de ngrok en `ALLOWED_HOSTS` |
| `401 Unauthorized` al llamar a Rapyd (`UNAUTHENTICATED_API_CALL`) | Llaves con comillas/espacios en `.env`, o `amount` enviado como número en vez de string |
| El webhook nunca llega | El agente de ngrok no está corriendo, o la URL registrada en el dashboard de Rapyd no coincide exactamente (revisa `https://`, dominio, trailing slash) |
| Firma de webhook siempre inválida | Recuerda: para webhooks, `url_path` en la fórmula de firma es la **URL completa** (`https://dominio/path/`), no solo el path — a diferencia de las requests salientes hacia Rapyd |
| `429 Too Many Requests` en ngrok | Rate limit del plan gratuito — normalmente causado por reintentos automáticos de Rapyd ante webhooks que fallaron; espera a que se libere o revisa que tu endpoint esté respondiendo `200` |
