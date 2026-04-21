# Full Revenue Loans — Contexto del Producto

## Qué es

**Full Revenue Loans** (internamente "Préstamo MÁS") es un producto de crédito de R2 Capital que expande el underwriting de merchants más allá de sus ventas en plataforma (Rappi, Uber Eats, Klap, Haulmer, Bimbo) para evaluar el **100% de los ingresos del negocio** (ventas en mostrador, otras apps de delivery, pedidos directos).

El producto actual (RBF — Revenue Based Financing) solo financia en base a GMV de plataforma. Full Revenue Loans permite a merchants desbloquear préstamos 2-4x más grandes compartiendo datos fiscales, bancarios y de presencia digital.

## Oportunidad de negocio

- **Base instalada:** 240,001 usuarios activos, 106,887 ofertas disponibles
- **Target:** Top 25% de merchants con oferta activa
- **Oportunidad incremental:** $4M-$6M USD sobre base actual
- **Impacto esperado:** 2-3x en tamaño promedio de préstamo
- **Piloto inicial:** Batch de refills (merchants con historial de repago probado)

## Estructura del producto

### Modelo Progresivo de Verificación (3 Steps)

**Step 1 — Bureau Validation (1.5x plataforma, cap $15k USD)**
- Señales: Modelo de underwriting de plataforma existente + Bureau + KYB + Twilio Identity
- Top 20% de merchants en plataforma con GMV creciente
- Features: `avg_platform_gmv_6m`, `platform_gmv_volatility_6m`, `Age_months`, `bureau_score`, `active_delinquency_flag`, `credit_utilization_ratio`, `recent_inquiries_6m`

**Step 2 — Market Validation (3x plataforma, cap $20k USD)**
- Señales adicionales: Google Maps URL, Facebook & Instagram business accounts
- Valida existencia del negocio, crecimiento, calidad operativa, reputación
- Features: `total_review_count`, `review_growth_rate_6m`, `avg_rating`, `rating_trend_3m`, `listing_age_years`, `location_count`, `price_level_index`

**Step 3 — Full Fiscal Validation (4x plataforma, cap $30k USD)**
- Señales adicionales: RUT registration, CEC fiscal certificate
- Valida ingreso real declarado, flujo de caja, margen operativo
- Features: `avg_monthly_declared_revenue_12m`, `avg_monthly_invoiced_inflows_6m`, `avg_monthly_invoiced_outflows_6m`, `avg_monthly_fiscal_net_flow_6m`, `invoiced_revenue_std_dev_6m`, `fs_operating_margin`, `fs_net_income_year`, `active_tax_debt_amount`, `invoice_cancelation_ratio_6m`, `counterparty_tax_fraud_flag_rate`

### User-Defined Offer Size

El merchant elige su nivel de acceso a capital:
- **1x:** Oferta base (solo plataforma)
- **1.5x:** Bureau check
- **2.0x:** Bureau + Google Link
- **4x:** Bureau + Google + Statements/Invoices

Checkmate (god view) solo se usa para **matar o reducir** una aplicación, nunca para incrementar.

## Modelo de repago (Híbrido)

A diferencia del RBF puro (solo split pay), Full Revenue usa un modelo de cuota fija mensual con tres mecanismos:

1. **Split Pay (días 0-27):** Retención dinámica sobre ventas de plataforma (componente alineado a ingresos)
2. **Direct Debit (día 28+):** Piso mínimo de pago fijo — se programa cuando el merchant recibe pagos
3. **AI Collection Agents:** Detección temprana de estrés y outreach automatizado

### Flujo de repago (ejemplo con cuota de $1,000):
- Día 0-27: Merchant paga $900 vía split pay
- Día 28: R2 informa al merchant que se pagaron $900 y faltan $100
- Día 28: R2 ofrece opciones de pago: (a) QR code, (b) Tarjeta crédito/débito, (c) Débito directo
- Fin de mes: Cuenta al corriente → pasa al siguiente mes; Vencido → cargo por mora

## Arquitectura de underwriting

### Capas de datos

| Capa | Fuentes | Proveedores API |
|------|---------|----------------|
| Fiscal & Cashflow | SAT, facturas, estados financieros | Syntage (o Belvo) |
| Market Validation | Presencia digital, reseñas, ratings | Google Maps API, Google Places API |
| Platform Layer | GMV, volatilidad, antigüedad | Datos internos de plataforma |
| Bureau Layer | Score crediticio, morosidad, utilización | Bureau API |

### Principios clave de underwriting
- Bureau solo para validar, no como decisor principal
- Google/Market actúa como multiplicador de confianza sobre ingresos fiscales
- Checkmate solo reduce o mata aplicaciones
- El resultado actual siempre es MANUAL_REVIEW (un analista humano asigna monto final)

## Stack técnico del prototipo

### Frontend (Next.js 14 App Router — puerto 3000)
- `src/app/` — Páginas y rutas
- `src/components/` — Componentes UI + feature (GamifiedFlow, KycForm, CreditOfferCard, UnderwritingLoader, StatusCard)
- `src/hooks/` — `useApplicationStatus` (polling 5s), `useTracking`
- `src/lib/` — `api.ts`, `tracking.ts`, `validation.ts` (Zod)
- `src/types/` — Interfaces TypeScript

### Backend (Express + TypeScript — puerto 3001)
- `src/config/env.ts` — Variables de entorno validadas con Zod
- `src/clients/` — Integraciones externas:
  - `syntageClient.ts` — SAT/fiscal data (Syntage o Belvo), incluye `tax_compliance` y `cfdi_count_last_12m`
  - `googlePlacesClient.ts` — Extrae Place ID de URL de Maps, calcula `signals_score` (rating, reseñas, verificado, web, categoría)
  - `bureauClient.ts` — Score crediticio (stub 720 en DEMO_MODE)
  - `platformClient.ts` — GMV de plataforma (stub 900K MXN, tenure 36m en DEMO_MODE)
  - `facebookClient.ts` — Pages API + Instagram Graph API, OAuth flow con `buildAuthUrl`/`exchangeCode`
  - `twilioClient.ts` — Twilio Lookup v2: Identity Match, WhatsApp Business, SIM Swap, Line Type Intelligence
- `src/services/` — Lógica de negocio:
  - `underwriting.service.ts` — Motor con 4 fuentes de datos + multiplicadores (bureau, tenure, compliance, places, identity, WhatsApp, SIM swap)
  - `application.service.ts` — CRUD de aplicaciones, mapeo de resultados
  - `event.service.ts` — Tracking events
- `src/routes/` — Rutas Express + OAuth flows (Google, Facebook)
- `src/controllers/` — Controllers
- `src/models/` — Modelos de datos (Application con campos KYC, documentos, resultados de todas las fuentes)
- `src/middleware/` — CORS, validación, manejo de errores
- `src/utils/` — Utilidades

### Flujo de usuario en el prototipo

**Fase 1 — Aplicación (Full Revenue)**
```
/offers                    → Banner "Préstamo MÁS" con montos $75k/$100k/$200k
/full-revenue/info         → Página de producto con progress bar
/full-revenue/apply        → Flujo gamificado (GamifiedFlow):
                               Step 1: Identidad (RFC 12-13 chars + CIEC) + Teléfono
                               Step 2: Conexiones (Facebook/Instagram OAuth + Google Maps URL)
                               Step 3: Consentimiento (checkbox requerido + opcionales)
/full-revenue/status/:id   → StatusCard con datos de underwriting consolidados
                               (Bureau, GMV, Google rating, Facebook/Instagram, Twilio)
```

**Fase 2 — KYC (post-aprobación)**
```
KYC Step 1: RFC (pre-fill nombre/apellido/fecha/nacionalidad desde Rappi)
KYC Step 2: Dirección del negocio (calle+colonia en un campo)
KYC Step 3: Cuenta bancaria (titular pre-llenado con nombre del dueño)
KYC Step 4: INE frente + reverso (upload con multer)
KYC Step 5: Firma de contrato inline (canvas + checkbox + scroll detection)
KYC Step 6: Resumen con monto solicitado, tasa y cuota mensual
```

### API endpoints
| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/full-revenue/applications` | Crear solicitud |
| GET | `/full-revenue/applications/:id` | Estado de solicitud |
| POST | `/full-revenue/applications/:id/submit` | Enviar + correr underwriting |
| GET | `/full-revenue/oauth/facebook/redirect` | Iniciar Facebook OAuth |
| GET | `/full-revenue/oauth/facebook/callback` | Callback Facebook OAuth |
| POST | `/full-revenue/kyc` | Enviar datos KYC |
| POST | `/full-revenue/upload` | Upload documentos (multer) |
| POST | `/events` | Tracking events |

### Integraciones y fuentes de datos del motor de underwriting

El motor de underwriting combina **6 fuentes de datos** con multiplicadores:

| # | Fuente | Cliente | Señales clave | Boost |
|---|--------|---------|---------------|-------|
| 1 | SAT/Fiscal | `syntageClient` | Revenue mensual, tax compliance, CFDI count | Base |
| 2 | Google Places | `googlePlacesClient` | Rating, reseñas, verificado, categoría | signals_score |
| 3 | Bureau | `bureauClient` | Score crediticio (720 stub) | Multiplicador |
| 4 | Plataforma | `platformClient` | GMV 6m, volatilidad, tenure | Multiplicador |
| 5 | Facebook/Instagram | `facebookClient` | Fan count, followers, posts | +8% / +7% max |
| 6 | Twilio | `twilioClient` | Identity Match +5%, WhatsApp Biz +3%, SIM Swap -10% | Multiplicador |

**Fórmula:** `total = syntage_mensual × (1 + score_google/100 × 0.30) × bureau_mult × tenure_mult × compliance_mult × social_mult × identity_mult`

### Demo Mode
Con `DEMO_MODE=true`, todos los clientes usan stubs sin llamadas reales:
- **Syntage:** $720,000 MXN/año → $60,000 MXN/mes, tax_compliance OK
- **Google Places:** 4.3★, 187 reseñas, score 72/100
- **Bureau:** Score 720
- **Platform:** GMV 900K MXN, tenure 36 meses
- **Facebook/Instagram:** Stubs realistas con fan_count y followers
- **Twilio:** Identity match, WhatsApp Business activo

### Deploy
- **Railway:** Configurado con Dockerfiles explícitos (`backend/railway.json`, `frontend/railway.json`)
- **Docker Compose:** `NEXT_PUBLIC_API_URL` como variable con fallback local, healthcheck en backend
- **GCP Cloud Run:** Script en `scripts/deploy.sh` (Artifact Registry + Cloud Run)

## Ventaja estructural de R2

- **Collections ya desplegado:** Split pay embebido en partners, direct debit, AI collection agents
- **Underwriting probado:** Bureau integrado, modelos comportamentales en producción, tracking de volatilidad
- **Distribución embebida:** Cero costo de adquisición sobre base actual
- **Estrategia de piloto controlada:** Batch de refills primero, expansión gradual, checkmate como seatbelt

## Contexto de mercado

Merchants piden activamente:
- Porcentajes de retención más altos para pagar más rápido
- Formas de pago directo para reducir balance y acceder a más crédito
- Renovación inmediata con montos mayores tras buen repago
- Incremento de oferta tras pagar el préstamo actual

## Evolución del prototipo (historial de desarrollo)

1. **Primer commit:** Prototipo básico Préstamo MÁS con Syntage + Google OAuth
2. **Consolidated underwriting:** Reemplazó Google OAuth por Places API (URL de Maps), agregó Bureau y Platform como fuentes de datos con 4 multiplicadores
3. **Facebook/Instagram OAuth:** Step3 rediseñado con sección Requerida/Opcional, boost de social media
4. **Twilio Lookup:** Identity Match, WhatsApp Business, SIM Swap como señales antifraude
5. **Flujo gamificado KYC:** Reemplazó formulario multi-step por GamifiedFlow con conexiones de plataformas y subida de documentos (INE + selfie con multer)
6. **KYC completo:** Firma inline (canvas), pre-fill desde Rappi, etiquetas de montos ($75k/$100k/$200k), success page con stats
7. **Deploy Railway:** Dockerfiles explícitos para backend y frontend

## Variables de entorno / Credenciales

### Backend (`backend/.env`)

Ver `backend/.env.example` como referencia. Todas las variables se validan con Zod en `backend/src/config/env.ts`.

**Runtime (siempre requeridas):**
| Variable | Default | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `3001` | Puerto del servidor Express |
| `DEMO_MODE` | `false` | Si `true`, todos los clientes externos usan stubs |
| `APPROVAL_THRESHOLD` | `50000` | Umbral mensual MXN para underwriting |
| `FRONTEND_URL` | `http://localhost:3000` | URL del frontend (usado para CORS) |
| `BACKEND_URL` | `http://localhost:3001` | URL base para OAuth callbacks |

**Requeridas solo si `DEMO_MODE=false`:**

| Variable | Dónde obtenerla | Notas |
|---|---|---|
| `SYNTAGE_BASE_URL` | Contacto comercial Syntage | Default `https://api.syntage.com` |
| `SYNTAGE_API_KEY` | Contacto comercial Syntage | Acceso a datos SAT/CFDI |
| `SYNTAGE_TIMEOUT_MS` | — | Default `10000` |
| `GOOGLE_PLACES_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) → APIs → **Places API (Legacy)** | Habilitar también facturación en el proyecto GCP |
| `FACEBOOK_APP_ID` | [developers.facebook.com/apps](https://developers.facebook.com/apps) → Crear app tipo "Negocios" | Registrar en **Productos → Facebook Login** |
| `FACEBOOK_APP_SECRET` | Mismo dashboard → Configuración → Básica | Solo en el servidor, nunca en frontend |
| `TWILIO_ACCOUNT_SID` | [console.twilio.com](https://console.twilio.com) → Account Info | — |
| `TWILIO_AUTH_TOKEN` | Mismo dashboard → Account Info | Habilitar **Lookup v2** + add-ons Identity Match + SIM Swap |
| `GCP_PROJECT_ID` | [console.cloud.google.com](https://console.cloud.google.com) | Para Firestore real |
| `FIRESTORE_EMULATOR_HOST` | Opcional | Ej. `localhost:8080` para desarrollo con emulador |

**Scopes/permisos de Facebook OAuth:**
- `pages_show_list` — listar páginas del negocio
- `pages_read_engagement` — fan_count, ratings
- `instagram_basic` — followers, media count
- `business_management` — acceso a cuentas de negocio

**Callback URLs a registrar en Facebook Developers:**
- `${BACKEND_URL}/full-revenue/oauth/facebook/callback`
- En dev: `http://localhost:3001/full-revenue/oauth/facebook/callback`

### Frontend (`frontend/.env.local`)

Ver `frontend/.env.local.example`.

| Variable | Default | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | URL del backend. **Debe coincidir con `BACKEND_URL`** del backend |

> ⚠️ Las variables con prefijo `NEXT_PUBLIC_*` se exponen al cliente. Nunca poner secretos ahí.

### Clientes sin credenciales

- **`bureauClient.ts`** — Stub hardcoded (score 720). Cuando se integre Bureau real, agregar `BUREAU_API_KEY` / `BUREAU_BASE_URL` al schema.
- **`platformClient.ts`** — Stub hardcoded (GMV 900K MXN, tenure 36m). Cuando se conecte a datos internos, agregar credenciales correspondientes.

### Quick start (modo demo, sin credenciales)

```bash
# Backend
cp backend/.env.example backend/.env
# DEMO_MODE=true ya viene por default → no hace falta nada más

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

Con esto, todo el flujo funciona end-to-end con datos simulados realistas.

## Convenciones de código

- TypeScript en todo el proyecto (frontend y backend)
- Validación con Zod en ambos lados
- CORS restringido a `FRONTEND_URL`
- Tokens OAuth (Google, Facebook) solo en el servidor, nunca en frontend
- `consent_given: true` requerido por schema para submissions
- Containers Docker corren como `USER node` (no root)
- sessionStorage para persistir datos entre redirects OAuth
- Commit messages en español con prefijos convencionales (`feat:`, `fix:`, `chore:`)
