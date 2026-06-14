# Configuración de Google Play Billing para Finzen Pro

Esta guía cubre los pasos para que la compra de **Finzen Pro** funcione
dentro de la app de Android (Trusted Web Activity / TWA) publicada en
Google Play, usando la Digital Goods API + Payment Request API.

La versión web (finzen.dev / PWA) sigue usando el flujo de código de
licencia de Lemon Squeezy (Settings → Plan) y no se ve afectada por
estos pasos.

---

## 1. Requisitos previos

- Cuenta de **Google Play Developer** (pago único de $25 USD).
- Cuenta de **Google Payments Merchant**, vinculada a la cuenta de
  Play Developer (Play Console → Configuración → Cuenta de pagos).
- La app ya publicada en Play Console, al menos en un track de
  pruebas (interno o cerrado).
- Proyecto generado con [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
  (o Android Studio + TWA), con Digital Asset Links (`assetlinks.json`)
  configurado correctamente entre finzen.dev y la app.

---

## 2. Crear el producto "Finzen Pro" en Play Console

1. Play Console → tu app → **Monetizar → Productos → Productos integrados**.
2. Crear un producto nuevo:
   - **ID del producto**: `finzen_pro` (debe coincidir EXACTO con
     `PRO_SKU` en `src/lib/playBilling.js`).
   - **Nombre**: Finzen Pro
   - **Descripción**: Desbloquea cuentas ilimitadas, historial completo,
     Patrimonio, Deudas, Análisis y exportación de datos.
   - **Tipo**: producto administrado (compra única, no consumible).
   - **Precio**: $29 USD (o el equivalente que definas; Play convierte
     a moneda local automáticamente).
3. Activar el producto.

---

## 3. Habilitar Play Billing en el proyecto TWA (Bubblewrap)

En el `twa-manifest.json` del proyecto Android generado por Bubblewrap:

```jsonc
{
  // ...resto de la configuración existente...
  "features": {
    "playBilling": {
      "enabled": true
    }
  },
  "alphaDependencies": {
    "enabled": true
  }
}
```

Luego:

```bash
bubblewrap update
bubblewrap build
```

Esto genera un nuevo `.aab` que debes subir a Play Console (track de
pruebas primero, luego producción).

> Si el proyecto se generó con PWABuilder en vez de Bubblewrap
> directamente, PWABuilder usa Bubblewrap internamente — puedes
> descargar el proyecto fuente, aplicar este cambio y regenerar el
> paquete.

---

## 4. Configurar el backend de verificación (Vercel)

La función `api/verify-play-purchase.js` ya está incluida en el
proyecto. Necesita dos variables de entorno en Vercel
(Project Settings → Environment Variables):

### a) `ANDROID_PACKAGE_NAME`

El `applicationId` / package name de la app Android, tal como aparece
en Play Console (ej. `dev.finzen.twa`).

### b) `GOOGLE_SERVICE_ACCOUNT_JSON`

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) →
   selecciona (o crea) el proyecto vinculado a tu app en Play Console.
2. **IAM y administración → Cuentas de servicio → Crear cuenta de
   servicio** (ej. `finzen-play-billing`).
3. Genera una **clave JSON** para esa cuenta de servicio y descárgala.
4. En Play Console → **Configuración → Acceso de la API**, vincula el
   proyecto de Google Cloud y otorga a la cuenta de servicio el permiso
   **"Ver datos financieros y gestionar pedidos y suscripciones"**
   (Financial data) para tu app.
5. Copia el **contenido completo** del archivo JSON descargado y
   pégalo como valor de la variable `GOOGLE_SERVICE_ACCOUNT_JSON` en
   Vercel (como una sola línea / string JSON).

---

## 5. Probar la integración

1. Sube el `.aab` con Play Billing habilitado a un track de pruebas
   interno.
2. Agrega tu cuenta de Google como **tester** en ese track y en
   **Configuración → Pruebas de licencia** (License testing) para
   poder "comprar" sin que se te cobre de verdad.
3. Instala la app desde el link de pruebas de Play Console (no desde
   un APK suelto — la Digital Goods API solo funciona con apps
   instaladas vía Play Store).
4. En **Configuración → Plan**, debería aparecer el botón
   **"Comprar Finzen Pro"** en lugar del campo de código de licencia.
5. Completa la compra de prueba y confirma que:
   - La app marca el plan como **Pro** inmediatamente.
   - En los logs de la función de Vercel (`/api/verify-play-purchase`)
     se ve `valid: true` y no hay errores.
   - La compra aparece como **"Confirmada" (acknowledged)** en Play
     Console → Pedidos.

---

## 6. Resumen de archivos relevantes en el código

- `src/lib/playBilling.js` — wrapper de la Digital Goods API /
  Payment Request API. `PRO_SKU` define el ID del producto.
- `src/context/LicenseContext.jsx` — detecta compras existentes al
  iniciar, expone `playBillingAvailable` y `purchasePro()`.
- `src/pages/Settings.jsx` — UI de "Plan": muestra el botón de compra
  de Play Billing cuando está disponible, o el campo de código de
  licencia de Lemon Squeezy en la web.
- `api/verify-play-purchase.js` — función serverless que verifica y
  confirma ("acknowledge") la compra con la Google Play Developer API.
