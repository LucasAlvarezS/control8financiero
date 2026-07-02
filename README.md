# Control Financiero

PWA para el control de gastos personales en Chile: carga manual y automática de
movimientos (Mercado Pago, BancoEstado y Banco de Chile vía Fintoc),
categorización automática, dashboard simple y seguimiento de ahorro.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- Prisma 7 + Postgres (recomendado: [Supabase](https://supabase.com))
- Auth.js (NextAuth v5) con **Google OAuth**, restringido a tu cuenta (app de un
  solo usuario, sesión persistente sin logout)
- UI mobile-first con marca morada (`#3C0061`), modo claro/oscuro (`next-themes`)
  y gráficos con Recharts (dona + área)
- Integraciones: Mercado Pago (OAuth) y Fintoc (BancoEstado, Banco de Chile)
- PWA: manifest nativo de Next.js + service worker propio (`public/sw.js`)

## Setup local

1. Copiar variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Completar `DATABASE_URL` (Supabase u otro Postgres), `AUTH_SECRET`
   (`npx auth secret`) y `ENCRYPTION_KEY` (`openssl rand -base64 32`).

   Para el login, crear un OAuth Client ID en [Google Cloud
   Console](https://console.cloud.google.com/apis/credentials) (tipo "Web
   application", redirect URI `<APP_URL>/api/auth/callback/google`) y completar
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. En `ALLOWED_EMAILS` poné tu propio
   email de Google (sólo esas cuentas podrán entrar).

   Las variables de Mercado Pago y Fintoc son necesarias sólo para probar esas
   integraciones (fase 2 y 3).

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Crear las tablas y cargar categorías/reglas default:

   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Ir a `/login` e iniciar sesión con Google (con la cuenta que pusiste en
   `ALLOWED_EMAILS`). El usuario se crea automáticamente en el primer login y la
   sesión queda persistente.

## Sincronización periódica

Los endpoints `/api/cron/sync-mercadopago` y `/api/cron/sync-fintoc` están
protegidos con el header `Authorization: Bearer $CRON_SECRET`. El workflow
`.github/workflows/sync-cron.yml` los llama cada hora usando los secrets de
GitHub Actions `APP_BASE_URL` y `CRON_SECRET` (configurarlos en Settings →
Secrets del repositorio una vez desplegada la app).

## Notas sobre integraciones bancarias

- **Banco Falabella** no está soportado por el producto Movements de Fintoc
  (sólo para iniciar pagos), por lo que no está incluido como cuenta
  conectable automáticamente.
- Los nombres de endpoints/campos de la API de Fintoc en
  `src/lib/integrations/fintoc/` siguen su documentación pública, pero
  conviene verificarlos contra la referencia vigente de Fintoc antes de
  conectar credenciales reales de producción.
