#!/usr/bin/env bash
# Full Revenue Loan — GCP Cloud Run Deployment Script
# Usage: GCP_PROJECT_ID=my-project ./scripts/deploy.sh
set -euo pipefail

# --- Config ---
PROJECT="${GCP_PROJECT_ID:?GCP_PROJECT_ID env var required}"
REGION="${REGION:-us-central1}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT}/full-revenue"
APPROVAL_THRESHOLD="${APPROVAL_THRESHOLD:-50000}"

echo "=== Full Revenue Loan — Deploying to ${PROJECT} (${REGION}) ==="

# --- 1. One-time GCP setup (idempotent) ---
echo ""
echo "--- [1/7] Enabling GCP APIs ---"
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  --project="${PROJECT}" \
  --quiet

echo ""
echo "--- [2/7] Creating Artifact Registry repo (skips if exists) ---"
gcloud artifacts repositories describe full-revenue \
  --location="${REGION}" \
  --project="${PROJECT}" 2>/dev/null || \
gcloud artifacts repositories create full-revenue \
  --repository-format=docker \
  --location="${REGION}" \
  --project="${PROJECT}" \
  --quiet

echo ""
echo "--- [3/7] Creating Firestore database (skips if exists) ---"
gcloud firestore databases describe \
  --project="${PROJECT}" 2>/dev/null || \
gcloud firestore databases create \
  --location="${REGION}" \
  --project="${PROJECT}" \
  --quiet

# --- 2. Secrets (run once; update with new versions if needed) ---
echo ""
echo "--- Checking secrets ---"
echo "Ensure these secrets exist in Secret Manager:"
echo "  SYNTAGE_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
echo "To create: echo -n 'value' | gcloud secrets create SECRET_NAME --data-file=-"

# --- 3. Build and deploy backend ---
echo ""
echo "--- [4/7] Building backend image ---"
docker build \
  -t "${REGISTRY}/backend:latest" \
  ./backend

echo ""
echo "--- [5/7] Pushing backend image ---"
docker push "${REGISTRY}/backend:latest"

echo ""
echo "--- [5/7] Deploying backend to Cloud Run ---"
gcloud run deploy full-revenue-backend \
  --image="${REGISTRY}/backend:latest" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3001 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=${PROJECT},DEMO_MODE=false,APPROVAL_THRESHOLD=${APPROVAL_THRESHOLD},SYNTAGE_TIMEOUT_MS=10000" \
  --set-secrets="SYNTAGE_API_KEY=SYNTAGE_API_KEY:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest" \
  --project="${PROJECT}" \
  --quiet

BACKEND_URL=$(gcloud run services describe full-revenue-backend \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --format="value(status.url)")

echo "Backend deployed: ${BACKEND_URL}"

# --- 4. Build and deploy frontend ---
echo ""
echo "--- [6/7] Building frontend image (baking in API URL) ---"
docker build \
  --build-arg "NEXT_PUBLIC_API_URL=${BACKEND_URL}" \
  -t "${REGISTRY}/frontend:latest" \
  ./frontend

docker push "${REGISTRY}/frontend:latest"

gcloud run deploy full-revenue-frontend \
  --image="${REGISTRY}/frontend:latest" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --project="${PROJECT}" \
  --quiet

FRONTEND_URL=$(gcloud run services describe full-revenue-frontend \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --format="value(status.url)")

echo "Frontend deployed: ${FRONTEND_URL}"

# --- 5. Update backend with final URLs ---
echo ""
echo "--- [7/7] Updating backend with frontend URL + OAuth redirect URI ---"
gcloud run services update full-revenue-backend \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --update-env-vars="FRONTEND_URL=${FRONTEND_URL},GOOGLE_REDIRECT_URI=${BACKEND_URL}/full-revenue/oauth/google/callback" \
  --quiet

echo ""
echo "=== Deployment complete! ==="
echo "Frontend: ${FRONTEND_URL}"
echo "Backend:  ${BACKEND_URL}"
echo "Health:   ${BACKEND_URL}/health"
echo ""
echo "Add ${BACKEND_URL}/full-revenue/oauth/google/callback to your"
echo "Google Cloud Console OAuth 2.0 authorized redirect URIs."
