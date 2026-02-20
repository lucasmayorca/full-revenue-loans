# Préstamo MÁS — Rappi Full Revenue Loans

Prototipo del feature **Préstamo MÁS** para socios de Rappi. Los comercios pueden solicitar un préstamo basado en sus ventas totales (Rappi + fuera de plataforma), conectar su cuenta de Google y recibir una evaluación de underwriting con datos reales de Syntage (SAT) y señales de Google Business.

---

## Desarrollo local (sin Docker)

### Prerrequisitos

- **Node.js 20+** → [Descargar en nodejs.org](https://nodejs.org)
- **Git** → [Descargar en git-scm.com](https://git-scm.com)

> ⚠️ No se necesitan credenciales de Google, GCP, ni Syntage para correr la app en modo demo.

### Pasos

```bash
# 1. Clonar el repo
git clone <url-del-repo>
cd Full_revenue_loans

# 2. Configurar variables de entorno del backend (ya viene listo para demo)
cp backend/.env.example backend/.env

# 3. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install
```

Luego abrir **dos terminales**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# ✅ Listo cuando aparece: "Server running on port 3001"
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# ✅ Listo cuando aparece: "ready - started server on 0.0.0.0:3000"
```

### Abrir la app

| Servicio | URL |
|----------|-----|
| App | http://localhost:3000/offers |
| Backend health check | http://localhost:3001/health |

---

## ¿Qué es DEMO MODE?

Con `DEMO_MODE=true` (el valor por defecto en `.env.example`), la app **no hace llamadas reales** a Syntage ni a Google. Los datos de underwriting se generan automáticamente con valores realistas:

- **Syntage (SAT):** $720.000 MXN/año → $60.000 MXN/mes
- **Google Business:** 4.3★, 187 reseñas, 3.240 vistas de perfil, score 72/100

El resultado siempre queda en **"Solicitud en revisión"** (MANUAL_REVIEW) para que un analista humano determine el monto final del Préstamo MÁS.

---

## Flujo de usuario

```
/offers                    → Pantalla con banner "Préstamo MÁS"
/full-revenue/info         → Página de producto con los 4 pasos
/full-revenue/apply        → Formulario de 3 pasos:
                               Paso 1: Identidad del negocio (RFC + Clave CIEC)
                               Paso 2: Ventas fuera de Rappi
                               Paso 3: Consentimiento + conexión Google (opcional)
/full-revenue/status/:id   → Pantalla de resultado con datos del underwriting
```

---

## Estructura del proyecto

```
Full_revenue_loans/
├── frontend/               # Next.js 14 App Router (puerto 3000)
│   ├── src/app/            # Páginas y rutas
│   ├── src/components/     # Componentes UI + feature
│   ├── src/hooks/          # useApplicationStatus (polling 5s), useTracking
│   ├── src/lib/            # api.ts, tracking.ts, validation.ts (Zod)
│   └── src/types/          # Interfaces TypeScript
├── backend/                # Express + TypeScript (puerto 3001)
│   ├── src/config/env.ts   # Variables de entorno validadas con Zod
│   ├── src/clients/        # Syntage, Google OAuth + Business API
│   ├── src/services/       # Lógica de negocio + motor de underwriting
│   ├── src/routes/         # Rutas Express + OAuth flow
│   ├── src/middleware/      # CORS, validación, manejo de errores
│   └── openapi.yaml        # Especificación OpenAPI 3.1
└── docker-compose.yml      # Setup alternativo con Docker
```

---

## API Reference

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/full-revenue/applications` | Crear solicitud |
| GET | `/full-revenue/applications/:id` | Obtener estado de solicitud |
| POST | `/full-revenue/applications/:id/submit` | Enviar + correr underwriting |
| GET | `/full-revenue/oauth/google/redirect` | Iniciar Google OAuth |
| GET | `/full-revenue/oauth/google/callback` | Callback OAuth |
| POST | `/events` | Guardar evento de tracking |

---

## Motor de underwriting

```
1. Fetch datos Syntage (SAT) — con timeout de 10s
     └── DEMO_MODE → stub: $60.000 MXN/mes

2. Fetch datos Google Business (si el usuario conectó Google)
     └── DEMO_MODE → stub: score 72/100, $38.000 MXN/mes GA4

3. Calcular ingreso total ponderado:
     total = syntage_mensual × (1 + score_google/100 × 0.30)
     (Google actúa como multiplicador de confianza, no como ingreso adicional)

4. Resultado: siempre MANUAL_REVIEW
     Un analista humano revisa los datos y asigna el monto final del Préstamo MÁS.
```

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `DEMO_MODE` | No | `false` | `true` = sin credenciales reales |
| `PORT` | No | `3001` | Puerto del servidor |
| `APPROVAL_THRESHOLD` | No | `50000` | Umbral de evaluación (MXN/mes) |
| `SYNTAGE_BASE_URL` | Solo prod | — | URL base de Syntage |
| `SYNTAGE_API_KEY` | Solo prod | — | API key de Syntage |
| `GOOGLE_CLIENT_ID` | Solo prod | — | OAuth client ID de Google |
| `GOOGLE_CLIENT_SECRET` | Solo prod | — | OAuth client secret de Google |
| `GOOGLE_REDIRECT_URI` | No | `http://localhost:3001/...` | URL de callback OAuth |
| `GCP_PROJECT_ID` | Solo prod | — | ID de proyecto GCP |
| `FRONTEND_URL` | No | `http://localhost:3000` | URL del frontend (CORS) |

### Frontend (`frontend/.env.local`)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NEXT_PUBLIC_API_URL` | Sí | URL del backend |

---

## Alternativa: Correr con Docker

```bash
cp backend/.env.example backend/.env
docker-compose up
```

Visitar: http://localhost:3000/offers

---

## Deployment a GCP Cloud Run

### Prerrequisitos

```bash
gcloud auth login
gcloud auth configure-docker us-central1-docker.pkg.dev
gcloud config set project TU_PROJECT_ID
```

### Guardar secrets en Secret Manager

```bash
echo -n "tu-syntage-api-key"     | gcloud secrets create SYNTAGE_API_KEY --data-file=-
echo -n "tu-google-client-id"    | gcloud secrets create GOOGLE_CLIENT_ID --data-file=-
echo -n "tu-google-client-secret"| gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-
```

### Deploy

```bash
GCP_PROJECT_ID=tu-project-id ./scripts/deploy.sh
```

El script habilita las APIs necesarias, crea el repo de Artifact Registry, construye y pushea las imágenes Docker, y deploya ambos servicios de Cloud Run.

### Configurar Google OAuth en producción

Agregar la URL de callback del backend en Google Cloud Console → APIs & Services → Credentials:
```
https://full-revenue-backend-HASH-uc.a.run.app/full-revenue/oauth/google/callback
```

---

## Seguridad

- Sin secrets en el frontend (solo `NEXT_PUBLIC_API_URL`)
- Todas las rutas del backend validadas con Zod
- CORS restringido solo a `FRONTEND_URL`
- Tokens de Google guardados únicamente en el store del servidor, nunca enviados al frontend
- `consent_given: true` requerido por schema — el backend rechaza submissions sin consentimiento
- Containers Docker corren como `USER node` (no root)
