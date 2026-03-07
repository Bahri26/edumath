# Edumath Deployment Guide

كُنّی تمام تحضیرات انجام دادیماور اب ہمیں Google Cloud Run میں Edumath کو تھوڑی منتقل کرنا ہے۔

## Prerequisites

```bash
# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Authenticate with gcloud
gcloud auth login
gcloud config set project project-ef733f7a-3171-45c7-b29

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  sqladmin.googleapis.com
```

## Deployment Options

### Option 1: Automated Deployment (Cloud Build)

```bash
# Trigger automated build and deployment
gcloud builds submit \
  --config=cloudbuild.yaml \
  --region=us-central1

# Monitor build
gcloud builds log -f [BUILD_ID]
```

### Option 2: Manual Deployment

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy both backend and frontend
./deploy.sh all

# Or deploy individually
./deploy.sh backend
./deploy.sh frontend

# Check deployment status
./deploy.sh status
```

### Option 3: Direct Cloud Run Deployment

#### Backend

```bash
cd backend

# Deploy with Cloud SQL connection
gcloud run deploy edumath-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=project-ef733f7a-3171-45c7-b29" \
  --set-cloudsql-instances="project-ef733f7a-3171-45c7-b29:us-central1:edumath-db" \
  --entry-point="npm start"
```

#### Frontend

```bash
cd frontend

# Build production
npm install
npm run build

# Deploy
gcloud run deploy edumath-frontend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --set-env-vars="VITE_API_BASE_URL=https://[BACKEND_URL]"
```

## Post-Deployment

### 1. Configure DNS

```bash
# Get service URLs
gcloud run services list --region us-central1

# Map custom domain (optional)
gcloud run domain-mappings create \
  --service=edumath-frontend \
  --domain=edumath.example.com \
  --region=us-central1
```

### 2. Setup Load Balancer (Optional)

```bash
# Create Cloud Load Balancer for multi-region support
# https://cloud.google.com/load-balancing/docs
```

### 3. Verify Deployment

```bash
# Test backend API
curl https://[BACKEND_URL]/api/exams

# Test frontend
curl https://[FRONTEND_URL]

# Check logs
gcloud run logs read edumath-backend --region us-central1
gcloud run logs read edumath-frontend --region us-central1
```

### 4. Setup Monitoring

```bash
# Create uptime checks
gcloud monitoring uptime-checks create \
  --display-name="Edumath Backend" \
  --resource-type=uptime-url \
  --monitored-resource-labels=host=[BACKEND_URL]

# View alerts and metrics in Cloud Console
# https://console.cloud.google.com/monitoring
```

## Environment Variables

Create `.env.cloud` for Cloud Run:

```env
# Database
DB_HOST=/cloudsql/project-ef733f7a-3171-45c7-b29:us-central1:edumath-db
DB_USER=BahriAdmin
DB_PASSWORD=[FROM_SECRET_MANAGER]
DB_NAME=edumath

# JWT
JWT_SECRET=[FROM_SECRET_MANAGER]
JWT_REFRESH_SECRET=[FROM_SECRET_MANAGER]

# APIs
GEMINI_API_KEY=[FROM_SECRET_MANAGER]

# Cloud Storage
GCS_BUCKET_NAME=edumath-images
```

### Store Secrets in Secret Manager

```bash
# Create secrets
echo -n "[PASSWORD]" | gcloud secrets create db-password --data-file=-
echo -n "[JWT_SECRET]" | gcloud secrets create jwt-secret --data-file=-
echo -n "[API_KEY]" | gcloud secrets create gemini-api-key --data-file=-

# Grant access to Cloud Run service accounts
gcloud secrets add-iam-policy-binding db-password \
  --member=serviceAccount:edumath-backend@[PROJECT_ID].iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

## Rollback

```bash
# List previous revisions
gcloud run revisions list --region us-central1 --service edumath-backend

# Rollback to previous version
gcloud run deploy edumath-backend \
  --region us-central1 \
  --revision [PREVIOUS_REVISION_ID]
```

## Performance Optimization

### Backend

- Enable caching with Redis (Cloud Memorystore)
- Use connection pooling for database
- Implement rate limiting
- Enable HTTP/2

### Frontend

- Enable gzip compression (done in nginx.conf)
- Optimize images
- Tree-shaking unused code
- Lazy load components

## Cost Optimization

```bash
# Set autoscaling limits
gcloud run services update edumath-backend \
  --region us-central1 \
  --max-instances=10 \
  --min-instances=0

# Use committed use discounts
# https://cloud.google.com/run/pricing#committed-use-discounts
```

## Troubleshooting

### Backend fails to connect to Cloud SQL

```bash
# Verify Cloud SQL Proxy is running
gcloud sql connect edumath-db --user=BahriAdmin

# Check service account has Cloud SQL Client role
gcloud projects get-iam-policy [PROJECT_ID] \
  --flatten="bindings[].members" \
  --filter="bindings.members:edumath-backend@*"
```

### Frontend cannot reach backend API

```bash
# Check CORS headers
curl -H "Origin: https://[FRONTEND_URL]" \
  https://[BACKEND_URL]/api/exams -v

# Update CORS configuration in backend
# See controllers/examsController.js for middleware setup
```

### Build fails

```bash
# Check build logs
gcloud builds log [BUILD_ID] --tail=50

# Verify Dockerfile syntax
docker build --dry-run -f backend/Dockerfile .
```

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Best Practices](https://cloud.google.com/sql/docs/mysql/best-practices)
- [Container Registry](https://cloud.google.com/container-registry/docs)
- [Cloud Build](https://cloud.google.com/build/docs)
