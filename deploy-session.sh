#!/usr/bin/env bash
set -euo pipefail

# deploy-session.sh
# Deploy backend and frontend to Cloud Run using the currently authenticated
# gcloud session (no service-account secrets required).
# Usage: ./deploy-session.sh [backend|frontend|all|status]

PROJECT_ID=${GCP_PROJECT:-}
REGION=${GCP_REGION:-us-central1}
BACKEND_SERVICE="edumath-backend"
FRONTEND_SERVICE="edumath-frontend"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Please install Google Cloud SDK and authenticate."
  exit 1
fi

if [ -z "$PROJECT_ID" ]; then
  echo "GCP_PROJECT env var not set. Using gcloud config project."
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
fi

if [ -z "$PROJECT_ID" ]; then
  echo "No project configured. Run 'gcloud config set project <PROJECT_ID>' or set GCP_PROJECT env var."
  exit 1
fi

echo "Using GCP project: $PROJECT_ID"
echo "Using region: $REGION"

function ensure_logged_in() {
  ACTIVE_ACCT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)") || true
  if [ -z "$ACTIVE_ACCT" ]; then
    echo "No active gcloud account. Run 'gcloud auth login' or 'gcloud auth activate-service-account'."
    exit 1
  fi
  echo "Authenticated as: $ACTIVE_ACCT"
}

function deploy_backend() {
  echo "Deploying backend from ./backend using current session..."
  pushd backend >/dev/null
  # Build & deploy from source
  gcloud run deploy "$BACKEND_SERVICE" \
    --source . \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars NODE_ENV=production \
    --set-cloudsql-instances "$PROJECT_ID:$REGION:edumath-db" || true
  popd >/dev/null
}

function deploy_frontend() {
  echo "Building frontend and deploying from ./frontend using current session..."
  pushd frontend >/dev/null
  npm ci --silent
  npm run build
  gcloud run deploy "$FRONTEND_SERVICE" \
    --source . \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars VITE_API_BASE_URL="https://$BACKEND_SERVICE-$REGION.a.run.app" || true
  popd >/dev/null
}

function show_status() {
  echo "Backend service status:"
  gcloud run services describe "$BACKEND_SERVICE" --project "$PROJECT_ID" --region "$REGION" || true
  echo "\nFrontend service status:"
  gcloud run services describe "$FRONTEND_SERVICE" --project "$PROJECT_ID" --region "$REGION" || true
}

cmd=${1:-all}
ensure_logged_in
case "$cmd" in
  backend)
    deploy_backend
    ;;
  frontend)
    deploy_frontend
    ;;
  all)
    deploy_backend
    deploy_frontend
    ;;
  status)
    show_status
    ;;
  *)
    echo "Usage: $0 {backend|frontend|all|status}"
    exit 1
    ;;
esac

echo "Deployment complete. Run 'gcloud run services list --region $REGION' to view endpoints."
