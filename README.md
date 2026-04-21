# Full Revenue Loans — R2 Capital

Prototipo del producto **Full Revenue Loans** (internamente "Préstamo MÁS") de R2 Capital, embebido en la experiencia de Uber Eats Manager. Los merchants pueden solicitar un préstamo evaluado sobre el **100% de sus ingresos** (no solo el GMV de plataforma) compartiendo datos fiscales, presencia digital y señales antifraude.

---

## 🌐 Entornos deployados

| Entorno | URL |
|---|---|
| **Frontend (canónico)** | https://full-revenue-frontend-zw22.vercel.app |
| **Frontend (alt)** | https://full-revenue-frontend.vercel.app |
| **Backend API** | https://full-revenue-backend-production.up.railway.app |
| **Admin dashboard** | https://full-revenue-frontend-zw22.vercel.app/admin/metrics |
| **Flujo principal** | https://full-revenue-frontend-zw22.vercel.app/offers |

**Infraestructura:** Vercel (Next.js frontend) + Railway (Express backend). Deploy automático en `push` a `main`.

---

## Desarrollo local

### Prerrequisitos

- **Node.js 20+** → [nodejs.org](https://nodejs.org)
- **Git**

> No se necesitan credenciales reales para correr local — `DEMO_MODE=true` usa stubs realistas para todas las integraciones externas.

### Setup

```bash
git clone https://github.com/lucasmayorca/full-revenue-loans.git
cd full-revenue-loans

cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

cd backend && npm install
cd ../frontend && npm install
```

### Correr

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
# Listo cuando aparece: "server_started ... port=3001"
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
# Abrir http://localhost:3000/offers
```

---

## ¿Qué es DEMO_MODE?

Con `DEMO_MODE=true` todos los clientes externos usan stubs sin hacer llamadas reales:

| Cliente | Stub |
|---|---|
| Syntage (SAT) | $60,000 MXN/mes, tax_compliance OK, 847 CFDIs |
| Google Places | 4.3★, 187 reseñas, score 72/100 |
| Bureau | Score 720 |
| Platform (Rappi/Uber) | GMV 900K MXN, tenure 36m |
| Facebook/Instagram | 3,200 fans, 1,850 followers |
| Twilio Lookup | Identity match, WhatsApp Business |

---

## Flujo de usuario

### Aplicación (Full Revenue)
```
/offers                    → Banner "Préstamo MÁS"
/full-revenue/info         → Página de producto
/full-revenue/apply        → Flujo gamificado (3 steps):
                               Step 1: Identidad (RFC + CIEC + teléfono)
                               Step 2: Conexiones (Facebook + Google Maps URL)
                               Step 3: Consentimiento
/full-revenue/status/:id   → Resultado consolidado del underwriting
```

### KYC (post-aprobación)
```
Step 1: RFC (pre-fill desde Uber/Rappi)
Step 2: Dirección del negocio
Step 3: Cuenta bancaria (titular pre-llenado)
Step 4: INE frente + reverso (upload)
Step 5: Firma de contrato inline
Step 6: Resumen con monto, tasa, cuota mensual
```

### Admin
```
/admin/metrics   → Dashboard R2 con funnel + aplicaciones reales
```

---

## Arquitectura

```
┌─────────────────┐      HTTPS      ┌──────────────────┐
│  Next.js 14 app │ ───────────────>│  Express API     │
│  Vercel         │                 │  Railway         │
└─────────────────┘                 └────────┬─────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        ▼                    ▼                    ▼
                 ┌───────────┐       ┌───────────────┐    ┌──────────────┐
                 │ Syntage   │       │ Google Places │    │ Twilio       │
                 │ (SAT)     │       │ (Maps URL)    │    │ Lookup v2    │
                 └───────────┘       └───────────────┘    └──────────────┘
                        │                    │                    │
                 ┌──────▼──────┐     ┌───────▼──────┐    ┌───────▼──────┐
                 │ Bureau      │     │ Facebook     │    │ Platform     │
                 │ (stub)      │     │ OAuth        │    │ (stub Rappi) │
                 └─────────────┘     └──────────────┘    └──────────────┘
```

### Fórmula de underwriting
```
total = syntage_mensual
      × (1 + score_google/100 × 0.30)
      × bureau_mult
      × tenure_mult
      × compliance_mult
      × social_mult
      × identity_mult
```

Si `total ≥ APPROVAL_THRESHOLD` → `APPROVED` con credit offer calculada. Siempre hay **MANUAL_REVIEW** final por un analista.

---

## API Reference

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check (incluye `demo_mode`) |
| POST | `/full-revenue/applications` | Crear solicitud |
| GET | `/full-revenue/applications` | Listar todas (dashboard admin) |
| GET | `/full-revenue/applications/:id` | Obtener aplicación |
| POST | `/full-revenue/applications/:id/submit` | Enviar + correr underwriting |
| GET | `/full-revenue/oauth/facebook/redirect` | Iniciar Facebook OAuth |
| GET | `/full-revenue/oauth/facebook/callback` | Callback Facebook OAuth |
| POST | `/full-revenue/kyc` | Enviar datos KYC |
| POST | `/full-revenue/upload` | Upload documentos (multer) |
| POST | `/events` | Tracking event |
| GET | `/events` | Listar events |
| GET | `/events/metrics` | Métricas agregadas (funnel, ctr) |

---

## Variables de entorno

### Backend (`backend/.env`)

Validadas con Zod en `backend/src/config/env.ts`.

| Variable | Requerida si DEMO_MODE=false | Notas |
|---|---|---|
| `NODE_ENV` | — | `development` \| `production` |
| `PORT` | — | Default `3001` |
| `DEMO_MODE` | — | Si `true`, todos los clientes usan stubs |
| `APPROVAL_THRESHOLD` | — | Default `50000` (MXN/mes) |
| `SYNTAGE_BASE_URL` | Opcional | Default `https://api.syntage.com` |
| `SYNTAGE_API_KEY` | Opcional¹ | Sin key → stub |
| `GOOGLE_PLACES_API_KEY` | **Sí** | [console.cloud.google.com](https://console.cloud.google.com) → Places API |
| `FACEBOOK_APP_ID` | Opcional | [developers.facebook.com](https://developers.facebook.com) |
| `FACEBOOK_APP_SECRET` | Opcional | — |
| `TWILIO_ACCOUNT_SID` | Opcional | [console.twilio.com](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | Opcional | Habilitar Lookup v2 |
| `GCP_PROJECT_ID` | **Sí** | Para Firestore |
| `FRONTEND_URL` | — | Default `http://localhost:3000` |
| `BACKEND_URL` | — | Default `http://localhost:3001` |
| `CORS_EXTRA_ORIGINS` | — | Orígenes adicionales separados por coma |

¹ Si `SYNTAGE_API_KEY` está vacía aun con `DEMO_MODE=false`, el cliente cae al stub automáticamente.

### Frontend (`frontend/.env.local`)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend (debe incluir `/full-revenue`) |

---

## OAuth Facebook — Camino B

La app Facebook (App ID `2174442286689292`) está configurada para pedir solo `public_profile + email` (no requieren App Review). Cuando se aprueben `pages_show_list`, `pages_read_engagement` e `instagram_basic`, editar el scope en:

```typescript
// backend/src/clients/facebookClient.ts
scope: "public_profile,email,pages_show_list,pages_read_engagement,instagram_basic"
```

El cliente ya hace degradación elegante: si no hay permiso para páginas, devuelve `connected: true` con `user_id`, `user_name`, `user_email` desde `/me`.

---

## Deploy

### Railway (backend)
- Project: `discerning-emotion` / service `full-revenue-backend`
- Dominio: `full-revenue-backend-production.up.railway.app`
- Build: Dockerfile explícito (`backend/railway.json`)
- Auto-deploy en `push` a `main`

### Vercel (frontend)
- Team: `lucasmayorca-7991s-projects`
- Dos proyectos: `full-revenue-frontend` y `full-revenue-frontend-zw22`
- Framework: Next.js 14
- Env vars seteadas: `NEXT_PUBLIC_API_URL`

### Manual redeploy
```bash
# Backend
cd backend && railway up --detach

# Frontend (cualquiera de los dos)
cd frontend && vercel deploy --prod
```

---

## Seguridad

- Sin secrets en el frontend (solo `NEXT_PUBLIC_API_URL`)
- Todas las rutas validadas con Zod
- CORS restringido a `FRONTEND_URL` + `CORS_EXTRA_ORIGINS`
- Tokens OAuth solo en el servidor
- `consent_given: true` obligatorio por schema
- Containers Docker corren como `USER node`
- sessionStorage para persistir formData entre redirects OAuth

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind |
| Backend | Express, TypeScript, Zod |
| Infra | Railway, Vercel, Docker |
| APIs externas | Google Places, Facebook Graph v19, Twilio Lookup v2, Syntage (SAT) |
