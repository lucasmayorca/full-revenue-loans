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
| GET | `/full-revenue/applications/:id/prequal` | Pre-qualificación con multiplicadores |
| POST | `/full-revenue/applications/:id/consent` | Recordar consentimientos (bureau, twilio, data) |
| POST | `/full-revenue/applications/:id/kyc` | Enviar datos KYC + documentos (multipart) |
| GET | `/full-revenue/oauth/facebook/redirect` | Iniciar Facebook OAuth |
| GET | `/full-revenue/oauth/facebook/callback` | Callback Facebook OAuth |
| POST | `/full-revenue/prefill-links/bulk` | **[Prefill]** Crear N links desde CSV |
| GET | `/full-revenue/prefill-links` | **[Prefill]** Listar links generados (admin) |
| GET | `/full-revenue/prefill/:token` | **[Prefill]** Hidratar /offers con datos del link |
| POST | `/events` | Tracking events |
| GET | `/events/metrics` | Métricas de funnel para dashboard admin |

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

### Prefill Links — distribución personalizada por merchant (clave para experimentos)

**Por qué existe:** Cada merchant tiene una oferta RBF distinta (calculada en función de su GMV, tenure, etc.) y datos personales propios. Mostrarles una oferta genérica al abrir `/offers` (a) sesgaría el experimento, y (b) podría incumplir compromisos al mostrarles montos que hoy no calificarían. La feature genera URLs cortas con un token único por merchant que pre-cargan ofertas y campos personalizados sin exponer PII en la URL.

**Cómo funciona:** En lugar de URLs genéricas, cada merchant recibe `https://full-revenue-frontend-zw22.vercel.app/offers?t=<token>`. Al abrirla, el frontend hace `GET /full-revenue/prefill/:token`, reemplaza las ofertas RBF hardcoded con las del merchant, calcula el monto Préstamo MÁS como `base_amount × 3`, guarda los datos personales en `sessionStorage` y los usa para pre-llenar los formularios de aplicación + KYC.

**Decisiones de diseño:**
- **DB-backed (no JWT):** URLs cortas (`?t=abc123`) compartibles por WhatsApp, revocables desde admin, trackeables (opened_at), sin exponer PII en la URL.
- **Token:** 10 caracteres random con `crypto.randomBytes` y alfabeto sin caracteres confusos (sin 0/O ni 1/I/l). Espacio: 54^10 ≈ 2×10^17.
- **Sin auth:** El admin (`/admin/prefill`) es público en este prototipo (decisión explícita del owner). En prod real, agregar gate por `X-Admin-Key`.
- **Multiplicadores fijos** (1.25x bureau, 1.5x social, 3x fiscal): solo varía `base_amount` por merchant, no los multiplicadores.
- **In-memory fallback:** Si `DATABASE_URL` no está configurada, el servicio cae a `Map<token, doc>` para dev local sin Postgres.

**Esquema (en `backend/src/db/schema.sql`):**
```sql
CREATE TABLE prefill_links (
  token VARCHAR(16) PRIMARY KEY,
  merchant_id TEXT,
  offers JSONB,              -- array de ofertas RBF custom
  base_amount INTEGER,       -- punto de partida para Préstamo MÁS (3x)
  prefill JSONB,             -- datos personales para pre-llenar forms
  expires_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,     -- marcado en el primer GET /prefill/:token
  used_at TIMESTAMPTZ,       -- (no usado todavía — para Fase 2)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Archivos:**
- `backend/src/models/PrefillLink.ts` — interfaces `PrefillOffer`, `PrefillData`, `PrefillLinkDoc`.
- `backend/src/services/prefillLink.service.ts` — parser CSV (con soporte para comillas), generador de tokens, CRUD con fallback in-memory.
- `backend/src/controllers/prefillLinks.controller.ts` — `createBulk`, `getPrefill`, `list`.
- `backend/src/routes/prefillLinks.ts` — montado en `app.ts` con `app.use("/full-revenue", prefillLinksRouter)`.
- `frontend/src/app/admin/prefill/page.tsx` — UI admin: textarea CSV + botón "Usar ejemplo" + tabla de resultados con copy/download.
- `frontend/src/app/offers/page.tsx` — `useEffect` que detecta `?t=xxx`, fetch de prefill, hidratación de ofertas + sessionStorage.
- `frontend/src/components/full-revenue/GamifiedFlow/index.tsx` — `readPrefillForStep1()` mergea prefill en step1Data.
- `frontend/src/components/full-revenue/KycForm/index.tsx` — `personalDefaults`, `addressDefaults`, `bankDefaults` aplican prefill a cada step KYC.
- `frontend/src/lib/api.ts` — `generatePrefillLinks`, `getPrefillLink`, `listPrefillLinks`.

**Formato CSV (todas las columnas opcionales excepto al menos una con datos):**

| Grupo | Columnas |
|---|---|
| ID | `merchant_id` |
| Identidad | `first_name`, `last_name`, `email`, `phone`, `birth_date` (AAAA-MM-DD), `nationality`, `marital_status` (soltero/casado/divorciado/viudo/union_libre) |
| Fiscal | `tax_id` (RFC, 12-13 chars), `ciec`, `legal_name`, `address` |
| Dirección KYC | `street`, `neighborhood`, `postal_code` (5 dígitos), `city`, `state` |
| Banco | `clabe` (18 dígitos), `bank_name`, `account_type` (debito/cheques), `account_holder` |
| Monto base Préstamo MÁS | `base_amount` (MXN sin separadores, ej: `180000`) |
| Ofertas RBF (hasta 3) | `offer1_amount`, `offer1_retention`, `offer1_total`, `offer1_fee`, `offer1_monthly`, `offer1_term`, idem `offer2_*`, `offer3_*` |

**Reglas de parseo:**
- Headers en fila 1, case-insensitive, columnas extra se ignoran silenciosamente.
- Campo vacío → no se setea (queda en blanco para que el merchant lo complete).
- Comas dentro de un valor → envolver en comillas dobles: `"Calle 5, Col. Centro"`.
- Comillas escapadas como `""` (estándar CSV).
- Encoding UTF-8 (Sheets: File → Download → CSV).
- Separadores de fila: `\n` o `\r\n`.

**Paso a paso para generar links:**
1. Armar el CSV en Sheets/Excel con las columnas del merchant.
2. Abrir https://full-revenue-frontend-zw22.vercel.app/admin/prefill (prod) o http://localhost:3000/admin/prefill (local).
3. Pegar el CSV completo en el textarea (botón "Usar ejemplo" para ver formato de referencia).
4. Configurar `Base URL` (auto-detectada del browser) y `Expira en (días)` (default 30).
5. Click **Generar links** → tabla con `merchant_id | token | URL` + botones "Copiar" por fila, "Copiar todos" (formato `merchant_id<TAB>url`), "Descargar CSV".
6. Enviar URLs por WhatsApp/email.
7. Tracking: en la sección "Links existentes" se ve `Abierto` (Sí cuando el merchant entra) y `Usado` (Sí cuando completa, pendiente de implementar).

**Hidratación frontend (`/offers?t=xxx`):**
1. `useSearchParams().get("t")` → si existe token, dispara `api.getPrefillLink(token)`.
2. Backend marca `opened_at = NOW()` (idempotente con `COALESCE`).
3. Reemplaza el state `offers` con las del link, calcula `fullRevenueMax = base_amount × 3`.
4. Guarda en sessionStorage:
   - `fr_base_amount` → consumido por `GamifiedFlow` para multiplicadores
   - `fr_prefill` → JSON con todos los campos pre-cargables
   - `fr_prefill_token` → para tracking posterior
5. Header cambia "Financiamiento" → "Hola {first_name}".
6. Errores: 404 → "Link inválido", 410 → "Link expirado", muestra ofertas base default.

**Tracking event:** `prefill_link_opened` (en `tracking.ts` como `EVENTS.PREFILL_LINK_OPENED`) — payload incluye `token` y `merchant_id` para correlación.

**Pre-fill en aplicación (GamifiedFlow):** `readPrefillForStep1()` mergea en step1Data: `email`, `legal_name`, `address`, `phone`, `tax_id`. CIEC y SAT consent NO se pre-llenan por seguridad (CIEC es password fiscal, consent debe ser explícito).

**Pre-fill en KYC:** `personalDefaults` (first_name, last_name, birth_date, cedula/RFC, nationality, marital_status), `addressDefaults` (street/neighborhood/postal_code/city/state, fallback `address` → `street` si no hay campos estructurados), `bankDefaults` (clabe, bank_name, account_type, account_holder con fallback al nombre del personal step).

**Estado actual y Fase 2 pendiente:**
- ✅ Generación bulk desde CSV
- ✅ Hidratación de ofertas + prefill
- ✅ Pre-fill en GamifiedFlow + KYC
- ✅ Tracking de `opened_at`
- ⏳ Marcar `used_at` cuando el merchant completa la aplicación
- ⏳ Endpoint POST `/admin/prefill-links/:token/revoke`
- ⏳ Métricas por link (conversion rate individual)
- ⏳ Upload directo de CSV (hoy solo paste)

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
8. **Prefill Links (Fase 1):** Generación bulk desde CSV de URLs personalizadas por merchant (`/offers?t=token`) con ofertas RBF custom + pre-fill de campos en aplicación y KYC. Admin UI en `/admin/prefill`. Tabla `prefill_links` en Postgres con fallback in-memory. Resuelve sesgo en experimentos por mostrar ofertas genéricas.
9. **Multiplicadores ajustados:** Bureau 1.25x, Social 1.5x, Fiscal 3x (antes 1.5x/2x/4x). FullRevenueCard ahora calcula `maxAmount = base × 3` en vez de `× 4`. Base por defecto: $62,800 alineado con oferta RBF real del merchant.
10. **Validation cleanup:** `legal_name` opcional (Razón Social ya no requerida en Step 1), `tax_id` (RFC) movido a Step 1 como requerido, `phone` acepta cualquier país en formato E.164 (`+\d{7,15}`), `curp` removido del schema.

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
- **Camino B (actual, sin App Review):** `public_profile`, `email` — solo valida identidad del dueño
- **Camino A (pendiente de App Review):** sumar `pages_show_list`, `pages_read_engagement`, `instagram_basic`, `business_management`

El cliente `facebookClient.getPageData` hace degradación elegante: si los scopes avanzados no están aprobados, devuelve `connected: true` con `user_id`, `user_name`, `user_email` y los campos de página quedan vacíos. El underwriting sigue funcionando.

**App de Facebook activa:** App ID `2174442286689292` (tipo Negocios, bajo el portfolio "Salvador Morlacos").

**Callback URLs a registrar en Facebook Developers:**
- `${BACKEND_URL}/full-revenue/oauth/facebook/callback`
- En dev: `http://localhost:3001/full-revenue/oauth/facebook/callback`

---

## frontend-rappi — Design System (Rappi Partner Portal)

### Arquitectura y stack

- **Framework:** Next.js 14 App Router — `frontend-rappi/`
- **Puerto local:** 3002 (`next dev -p 3002`)
- **Font:** Poppins vía `next/font/google` (weights 400/500/600/700)
- **Tailwind config:** `frontend-rappi/tailwind.config.ts`
- **Layout raíz:** `frontend-rappi/src/app/layout.tsx` — monta `RappiSidebar` (izquierda) + `RappiHeader` (arriba) + `<main>` scrollable
- **Componentes de layout:**
  - `frontend-rappi/src/components/layout/RappiSidebar.tsx` — sidebar oscuro con nav sections
  - `frontend-rappi/src/components/layout/RappiHeader.tsx` — header blanco con stripe naranja + logo + usuario

### Paleta de colores Tailwind (`rappi.*`)

| Token Tailwind | Valor Hex | Uso principal |
|---|---|---|
| `rappi-orange` | `#FF441F` | Accent principal — activos, CTAs, badges |
| `rappi-orange-dark` | `#E03518` | Hover de botones naranja |
| `rappi-orange-mid` | `#FF6B4A` | Extremo claro de gradientes naranja |
| `rappi-orange-light` | `#FFF3F0` | Fondo activo sidebar |
| `rappi-dark` | `#332927` | No se usa directamente — ver inline styles |
| `rappi-muted` | `#706967` | Texto secundario |
| `rappi-sidebar` | `#FFFFFF` | (Alias legado — sidebar real es `#17100C`) |

### Tokens de color inline (críticos — no en Tailwind)

| Variable | Valor | Dónde se usa |
|---|---|---|
| Sidebar bg | `#17100C` | `RappiSidebar` — fondo del aside |
| Sidebar section label | `#5C4A44` | Labels de sección (INICIO, ANÁLISIS…) |
| Sidebar inactive icon | `#7A6963` | Iconos no activos |
| Sidebar inactive text | `#9C8880` | Texto nav no activo |
| Sidebar hover | `#231510` | `hover:bg-[#231510]` |
| Sidebar active bg | `#2C1A13` | Item activo |
| Sidebar active border | `#FF441F` | `borderLeft: "3px solid #FF441F"` |
| Sidebar active text | `#FFFFFF` + w600 | Texto nav activo |
| Sidebar active icon | `#FF441F` | Icono activo |
| Sidebar disabled | opacity 0.45 | Items deshabilitados |
| Header bg | `#FFFFFF` | Header principal |
| Header border | `#EDE8E6` | `border-b` del header |
| Header stripe | `linear-gradient(90deg, #FF2D00 0%, #FF441F 40%, #FF6B4A 100%)` | Franja de 3px arriba del header |
| Header bell color | `#5C4A44` | Icono campanita |
| Header hover | `#F7F3F1` | Hover en bell y country selector |
| Page background | `#F7F3F1` | `body` y `<main>` — blanco cálido (vs `#F5F5F5` frío de Uber Eats) |
| Card dark text | `#17100C` | Títulos y montos en cards |

### Principios de diseño Rappi (diferenciadores vs Uber Eats)

1. **Sidebar oscuro** — El elemento #1 que separa visualmente Rappi de Uber Eats. Fondo `#17100C` (marrón cálido casi negro) vs sidebar blanco de Uber Eats.
2. **Gradientes, no flat color** — Las cards de oferta principal usan `linear-gradient(145deg, #D93010, #FF441F, #FF6B3D)` con profundidad visual. Nunca un `bg-rappi-orange` plano.
3. **Sombra cálida** — `box-shadow: 0 8px 32px rgba(255, 68, 31, 0.35)` en cards de CTA — sombra teñida naranja vs sombra neutra gris de Uber Eats.
4. **Glassmorphism en CTAs sobre gradiente** — Botón sobre card de gradiente usa `rgba(255,255,255,0.18)` bg + `rgba(255,255,255,0.35)` border.
5. **Decoraciones radiales** — Círculos absolutamente posicionados con `radial-gradient(circle, #FFFFFF, transparent)` a baja opacidad para dar profundidad a cards.
6. **Tipografía Poppins extrabold** — Montos en `text-[36px] font-extrabold tracking-tight`; subtítulos en extrabold, no medium.
7. **Fondo cálido** — `#F7F3F1` vs `#F5F5F5` de Uber Eats — diferencia sutil pero el ojo lo percibe.
8. **Stripe naranja en header** — Franja de 3px con gradiente naranja arriba del header blanco — patrón de identidad de Rappi.
9. **Accent card en ofertas** — OfferCards blancas con borde top de 4px con gradiente naranja (`linear-gradient(90deg, #FF441F, #FF6B4A)`) en vez de border plano.
10. **Badge NUEVO** — Fondo blanco, texto `#FF441F`, sin sombra — para destacar el producto Full Revenue.

### Especificaciones de componentes clave

#### RappiSidebar (`frontend-rappi/src/components/layout/RappiSidebar.tsx`)
- Ancho: `w-[172px]` fijo, `flex-shrink-0`, `z-20`
- Fondo: `style={{ background: "#17100C" }}`
- Sections con labels uppercase 10px tracking-wider
- Nav items: `px-4 py-[7px]`, gap-2 entre icon y label
- Estado activo: `borderLeft: "3px solid #FF441F", paddingLeft: "13px", background: "#2C1A13"`
- Hover (solo no-disabled): `hover:bg-[#231510]`
- Items deshabilitados: `opacity: 0.45, cursor: "default"`
- Item activo marcado si `pathname.startsWith("/offers")` o `pathname.startsWith("/full-revenue")`

#### RappiHeader (`frontend-rappi/src/components/layout/RappiHeader.tsx`)
- Estructura: `<div>` wrapper con stripe de 3px arriba + `<header>` de 60px
- Stripe: `h-[3px] w-full`, `linear-gradient(90deg, #FF2D00 0%, #FF441F 40%, #FF6B4A 100%)`
- Header: `h-[60px] bg-white border-b border-[#EDE8E6] flex items-center justify-between px-6`
- Logo: SVG Poppins Bold 24px, fill `#FF441F`
- Avatar: `linear-gradient(135deg, #FF441F, #FF6B4A)`, iniciales en bold 13px blanco

#### FullRevenueCard (en `frontend-rappi/src/app/offers/page.tsx`)
- Fondo: `linear-gradient(145deg, #D93010 0%, #FF441F 45%, #FF6B3D 100%)`
- Shadow: `0 8px 32px rgba(255, 68, 31, 0.35)`
- Border radius: `rounded-[12px]`
- Decoraciones: 2 círculos con `radial-gradient` en esquinas opuestas, `opacity-[0.12]` y `opacity-[0.07]`
- Monto: `text-[36px] font-extrabold tracking-tight text-white`
- Comparativo pill: `background: rgba(255,255,255,0.15)`, `border: 1px solid rgba(255,255,255,0.3)`
- CTA glassmorphism: `rgba(255,255,255,0.18)` bg + `rgba(255,255,255,0.35)` border, `rounded-[8px]`, h-11

#### OfferCard (RBF, en `frontend-rappi/src/app/offers/page.tsx`)
- Fondo: `bg-white rounded-[12px]`
- Shadow: `0 1px 8px rgba(23,16,12,0.08), 0 0 0 1px rgba(23,16,12,0.06)`
- Top accent: div `h-[4px]` con `linear-gradient(90deg, #FF441F, #FF6B4A)`, full-width
- Monto: `text-[28px] font-extrabold` color `#17100C`
- Accordion activo: bg `#FFF0EC`, texto `#FF441F`
- CTA button: `linear-gradient(90deg, #FF2D00, #FF5A1F)`, `rounded-[8px]`

### Historia de cambios de diseño

| Sesión | Cambio principal | Resultado |
|---|---|---|
| Sesión 1 | Copiar frontend Uber Eats → renombrar a `frontend-rappi` | Shell con mismo look |
| Sesión 2 | Aplicar colores naranja Rappi como swap de negro Uber Eats | "Uber Eats con naranja" — insuficiente |
| Sesión 3 | Rediseño world-class completo: sidebar oscuro, gradientes, sombra cálida, glassmorphism | Identidad visual Rappi genuina |

---

## Deployments

| Entorno | URL | Plataforma | Branding |
|---|---|---|---|
| Frontend Rappi (look Rappi) | https://frontend-rappi.vercel.app | Vercel | **Rappi** (header + sidebar) |
| Frontend canónico | https://full-revenue-frontend-zw22.vercel.app | Vercel | Genérico/Uber Eats |
| Frontend alt | https://full-revenue-frontend.vercel.app | Vercel | Genérico/Uber Eats |
| Backend API | https://full-revenue-backend-production.up.railway.app | Railway | — |
| Admin dashboard | https://full-revenue-frontend-zw22.vercel.app/admin/metrics | Vercel | — |
| Admin prefill | https://full-revenue-frontend-zw22.vercel.app/admin/prefill | Vercel | — |

**Routing por partner:**
- `RAPPI_MX` → `frontend-rappi.vercel.app/offers?t=TOKEN` (look Rappi)
- `UBEREATS_MX` → `full-revenue-frontend-zw22.vercel.app/offers?t=TOKEN` (look genérico)

**Vercel project IDs:**
- `frontend-rappi`: `prj_7L56L7vh2YlLsFgH7bwVEU8CTZgN`
- `full-revenue-frontend-zw22`: `prj_g8QJyF5v5guwfKjNcPUBuz0GXpEb`
- `full-revenue-frontend`: `prj_vrkX1gz3Z1AbgIEYEuLASAHTtfOa`

**Railway project:** `discerning-emotion` (ID `689b0ca1-0587-4c31-bda6-221a84b4665b`) / service `full-revenue-backend` (ID `3674e2c3-6dc0-4871-9094-8ae47a091499`).
**Postgres service:** `Postgres` (ID `057365d0-ee4a-4bac-8254-609e82a51bbe`) — conectado vía `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
**Vercel team:** `lucasmayorca-7991s-projects`.
**Auto-deploy:** push a `main` en GitHub dispara build en ambos.
**Manual redeploy:** `cd backend && npx --yes @railway/cli up --detach` (sube código local como nueva build — útil cuando el auto-deploy de GitHub no jaló el commit más reciente).
**⚠️ Importante:** `railway redeploy` solo re-lanza el último deployment con el mismo SHA — NO jala código nuevo. Usar `railway up` para forzar build desde el código actual.

### Página admin disponibles
- `/admin/metrics` — Funnel + tracking events (público, sin auth en este prototipo)
- `/admin/prefill` — Generador bulk de prefill links desde CSV (público)

### Persistencia
- Tablas: `applications`, `events`, `prefill_links` (todas con JSONB para datos anidados)
- Schema en `backend/src/db/schema.sql`, aplicado idempotentemente al boot por `backend/src/db/migrate.ts` (usa `CREATE TABLE IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS` — safe para correr en cada arranque)
- Cliente con pool singleton en `backend/src/clients/pgClient.ts`
- Si `DATABASE_URL` está vacía, fallback automático a in-memory (local dev). Cada service tiene su propio `Map<id, doc>` en memoria.

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

---

## Pipeline Snowflake → Prefill Links (carga masiva del piloto)

**Propósito:** generar links personalizados para merchants reales del data warehouse de R2, sin pegar CSVs manualmente. La sección anterior de "Prefill Links" cubre el endpoint backend; esta sección cubre **cómo generamos el CSV upstream desde Snowflake**.

### Acceso a Snowflake (para Claude Code o devs)

**Cuenta:** `bbcoxzm-lbb44019` (org `bbcoxzm`, account `lbb44019`, region `AWS_US_WEST_2`)
**Auth:** SSO via JumpCloud (`authenticator=externalbrowser`) — abre browser para autorizar, no requiere password en disco
**Role:** `PRODUCT_BASIC` (read-only)
**Warehouse:** `PRODUCT_WH_XS`

**Setup local sin sudo (recomendado, evita SnowSQL .pkg que requiere admin):**
```bash
pip3 install --user snowflake-connector-python
```

> Si Python 3.14 da `SSL CERTIFICATE_VERIFY_FAILED` en POSTs HTTPS externos, usar `curl` en lugar de `urllib`. Conexión a Snowflake funciona OK porque el connector trae sus propios certs.

### Carpeta `scripts/snowflake/`

| Archivo | Propósito |
|---|---|
| `snowflake_query.py` | Wrapper SSO. `python3 snowflake_query.py "SQL"` o `-f file.sql -o out.csv` |
| `upload_prefill.py` | POSTea CSV al backend bulk endpoint (con Python 3.14 falla SSL — usar curl) |
| `01_validation.sql` | Counts por partner_code y distribución de ofertas |
| `02_smoke_test.sql` | LIMIT 5 para validar formato |
| `03_partner_mapping.sql` | Mapping PARTNER_ID ↔ PARTNER_CODE para diagnóstico |
| `04_final_rappi_mx.sql` | Query final solo Rappi MX (296 merchants) |
| `05_final_rappi_ubereats_mx.sql` | Query combinada Rappi MX + UberEats MX (776 merchants — la del piloto) |

### Tablas usadas

| Tabla | Uso | Notas |
|---|---|---|
| `DEV_ANALYTICS.RBF_V3_RAW.OFFERS` | Ofertas RBF disponibles | Filtrar por `STATUS='AVAILABLE'`, `ENVIRONMENT='PRODUCTION'`, `DELETED_AT IS NULL`, vigencia `BETWEEN VALID_FROM AND VALID_TO`. Campos custom en `FEATURES` (VARIANT/JSONB): `amount`, `term`, `repayment_rate`, `total_repayment_amount`, `fixed_fee`, `payment_baseline`, `recommended`, `score_tag`. |
| `DEV_ANALYTICS.RBF_V3_STG.V_APPLICATIONS_LEVEL1` | Datos KYC + banco + identidad | Se filtra por `PARTNER_CODE` (`RAPPI_MX`, `UBEREATS_MX`, etc.). Campos: `MERCHANT_ID`, `NAME`, `EMAIL`, `LEGAL_REPRESENTATIVE_NAME__FIRST_NAME`, `LEGAL_REPRESENTATIVE_NAME__PATERNAL_LAST_NAME`, `BANK__*`, `STATUS`, `CREATED_AT`. |
| `DEV_ANALYTICS.RBF_V3_RAW.MERCHANTS_BY_PHONES` | Teléfonos validados | **Solo poblada para Rappi.** UberEats no tiene teléfonos ahí — outreach UberEats solo por email. |

### Mapping de Partners (PARTNER_ID ↔ PARTNER_CODE)

Las ofertas usan `PARTNER_ID` (UUID), las apps usan `PARTNER_CODE` (string). Mapping extraído joineando ambas tablas:

| PARTNER_CODE | PARTNER_ID | Currency | Tipo |
|---|---|---|---|
| **RAPPI_MX** | `72ce077d-35a5-4e6d-a8f4-2dd80c9ef408` | MXN | Comercios/restaurantes |
| **UBEREATS_MX** | `e4e6ca27-b317-4cf9-bad3-f20c3904a5eb` | MXN | Comercios/restaurantes |
| RAPPI_CO | `d82154bb-a9a5-45c4-ad95-6f3d9854dee4` | (varios) | — |
| RAPPI_CL | `3988315a-0963-4074-b486-765e126e018a` | CLP | — |
| UBEREATS_CL | `619af954-e1f3-4610-bdca-c62d02494dc8` | CLP | — |
| ⚠️ **UBEREARNERS_MX** | `7ed323d1-7656-4d88-974e-59314a25970a` | MXN | **Drivers — NO usar (ya tiene flujo con slider)** |
| UBEREARNERS_BR | `b5573ae1-9034-4bae-8852-82cf51a04ede` | ARP | — |
| UBEREARNERS_CO | `6f617473-be20-4aff-a5b8-d10c2d5bc659` | COP | — |
| UBEREARNERS_PE | `673af72b-6bc8-43ec-8166-3ea502a796bd` | PEN | — |
| INDRIVE_CO | `f095dca5-4f2c-47be-9235-c6afad2989be` | COP | — |
| INDRIVE_MX | `b3c8e065-800f-49e2-b077-d1331736660c` | MXN | — |
| INDRIVE_PE | `a84f7750-2cc4-4171-9df9-94deda0414e8` | PEN | — |
| INDRIVE_CL | `fea7bea2-3488-4766-a369-65c6df37b3fb` | CLP | — |
| HAULMER_CL | `249c61a8-6ae9-40d5-9b99-a85ad375a541` | CLP | — |
| KLAP_CL | `e8f27f83-c526-4c50-ac86-40222efacf58` | CLP | — |
| BIMBO_MX | `4812d2f4-19fc-4d5b-a029-44f1a9ff4547` | MXN | — |
| JUSTO_CL | `878a4906-5cda-4780-958b-2b1714596ebb` | CLP | — |

**Validado:** 0 overlap de `MERCHANT_ID` entre RAPPI_MX y UBEREATS_MX (cada merchant pertenece a un solo partner).

### Lógica de la query del piloto (`05_final_rappi_ubereats_mx.sql`)

**Estructura con CTEs:**
1. `ranked_offers` → Filtra ofertas AVAILABLE/REGULAR/MX vigentes, las rankea por `amount DESC` por merchant.
2. `offers_pivoted` → Pivot con `MAX(CASE WHEN rn=1...)` y `rn=2` para tener offer1 + offer2 en columnas.
3. `mx_apps` → Última aplicación por merchant filtrada por `PARTNER_CODE IN ('RAPPI_MX','UBEREATS_MX')`.
4. `phones` → Último teléfono validado por merchant.
5. **SELECT final:** `INNER JOIN mx_apps` (requiere app previa) + `LEFT JOIN phones` (teléfono opcional).

**Filtros del WHERE final:**
- `op.offer1_amount >= 50000` MXN — excluye ofertas chicas (sin esto la mediana era $27,900, sin sentido económico para Préstamo MÁS).
- `a.email IS NOT NULL` — necesario para outreach UberEats.

**Output: CSV con headers compatibles con `prefillLink.service.ts`:**
```
merchant_id, partner_code, first_name, last_name, email, phone,
legal_name, tax_id, clabe, bank_name, account_type, account_holder,
base_amount, offer1_amount, offer1_retention, offer1_total, offer1_fee, offer1_monthly, offer1_term,
offer2_amount, offer2_retention, offer2_total, offer2_fee, offer2_monthly, offer2_term
```

> El parser hace `.toLowerCase()` en headers, así que MAYÚSCULAS desde Snowflake funcionan OK.

### Subida masiva al backend (con base_url por partner)

**Crítico:** el `base_url` se setea al momento del POST, así que **hay que dividir el batch por partner** para que cada merchant reciba el frontend correcto. Si subimos todo junto con un solo `base_url`, los merchants Rappi van al frontend genérico.

**Workflow correcto:**

```bash
# 1) Filtrar source CSV por partner
python3 -c "
import csv
src = list(csv.DictReader(open('rappi_ubereats_mx_prefill.csv')))
rappi = [r for r in src if r['PARTNER_CODE']=='RAPPI_MX']
ueats = [r for r in src if r['PARTNER_CODE']=='UBEREATS_MX']
fields = list(src[0].keys())
for name, rows in [('rappi_only', rappi), ('ueats_only', ueats)]:
    with open(f'{name}.csv','w',newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
"

# 2) POST Rappi MX → frontend-rappi.vercel.app
python3 -c "
import json
print(json.dumps({
    'csv': open('rappi_only.csv').read(),
    'base_url': 'https://frontend-rappi.vercel.app',
    'expires_in_days': 30
}))" > /tmp/rappi.json

curl -sS -X POST \
  https://full-revenue-backend-production.up.railway.app/full-revenue/prefill-links/bulk \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/rappi.json -o /tmp/rappi_resp.json

# 3) POST UberEats MX → full-revenue-frontend-zw22.vercel.app
# (mismo procedimiento con base_url distinto)

# 4) Mergear ambas respuestas en un solo CSV de outreach con columna `partner`
```

**Routing por partner:**
- `RAPPI_MX` → `https://frontend-rappi.vercel.app/offers?t=TOKEN` (look Rappi)
- `UBEREATS_MX` → `https://full-revenue-frontend-zw22.vercel.app/offers?t=TOKEN` (look genérico)

### Estado del piloto actual (2026-04-25)

Primera carga ejecutada con éxito:

| Partner | Merchants | Con email | Con teléfono | Frontend asignado |
|---|---|---|---|---|
| RAPPI_MX | 296 | 296 | 212 | frontend-rappi.vercel.app |
| UBEREATS_MX | 480 | 480 | 0 | full-revenue-frontend-zw22.vercel.app |
| **Total** | **776** | **776** | **212** | — |

**Distribución de monto base (offer1, en MXN):**
- Max: $1,792,200
- Mediana: $105,300
- ≥ $100k: 112 merchants
- ≥ $200k: 47 merchants
- ≥ $500k: 24 merchants (top tier)

**Expiración:** 30 días desde 2026-04-25 (vence ~2026-05-25). Tokens en `prefill_links` (Postgres Railway).

**Output final:** `~/Downloads/rappi_ubereats_mx_LINKS.csv` con columnas:
```
merchant_id, partner, first_name, last_name, email, phone, base_amount, token, url
```

**Smoke test verificado:**
- Token: `AR3fsA57hS` (Paulina Villaseñor — refill perfecta, 4 préstamos pagados FINANCING_PAID/ACTIVE)
- 🔗 https://frontend-rappi.vercel.app/offers?t=AR3fsA57hS
- 2 ofertas custom: $329,400 / $222,800
- Prefill completo (nombre, email, CLABE, banco)
- Banner Préstamo MÁS: hasta $988,200 (3× base)

### Issues conocidos del pipeline

1. **Encoding `ñ` en `BANK__HOLDER_NAME`:** la `ñ` se exporta corrupta desde Snowflake (ej. `"VILLASEvOR"` en vez de `"VILLASEÑOR"`). Solo afecta `account_holder`; `legal_name` y nombres del rep legal vienen bien. No bloqueante.
2. **Alert en oferta-base RBF:** `frontend-rappi/src/app/offers/page.tsx:143` muestra `alert("Esta oferta base no está disponible en el prototipo. Prueba Préstamo MÁS.")` al clickear cards RBF — bloquea conversión. Decidir antes del envío masivo.
3. **`opened_at` se marca en primer GET:** cualquier verificación manual ensucia métricas. Para smoke tests usar tokens dedicados.
4. **Python 3.14 + urllib:** SSL handshake falla por certs no configurados. Workaround: `curl` para HTTPS externos.
5. **MERCHANTS_BY_PHONES sin UberEats:** los merchants UberEats no tienen teléfono — outreach solo por email.
6. **Refresh:** los tokens expiran en 30 días. Re-correr query y carga si el piloto se extiende.

### Próximos pasos sugeridos

1. **Outreach Rappi MX (296):** SMS/WhatsApp via teléfono (212 disponibles) + email backup (296).
2. **Outreach UberEats MX (480):** solo email.
3. **Tracking:** monitorear `PREFILL_LINK_OPENED`, `OFFER_CARD_VIEWED`, `STEP_COMPLETED` en `/admin/metrics`.
4. **A/B sobre look-and-feel:** comparar conversión Rappi vs canónico (ya está naturalmente segmentado por partner).
5. **Resolver alert de oferta-base** antes de envío masivo si querés medir conversión RBF directa.
6. **Marcar `used_at`** cuando el merchant completa la aplicación (Fase 2 de prefill, pendiente).
