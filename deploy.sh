#!/bin/bash

# Deployment script for Edumath to Google Cloud Run
# Usage: ./deploy.sh [backend|frontend|all]

set -e

PROJECT_ID="project-ef733f7a-3171-45c7-b29"
REGION="us-central1"
BACKEND_SERVICE="edumath-backend"
FRONTEND_SERVICE="edumath-frontend"

echo "🚀 Edumath Deployment Script"
echo "============================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Function to deploy backend
deploy_backend() {
    echo ""
    echo "📦 Deploying Backend..."
    echo "Build ID: $BUILD_ID"
    
    cd backend
    
    # Check if migrations exist
    if [ ! -d "migrations" ]; then
        echo "⚠️  No migrations directory found. Creating empty migrations directory..."
        mkdir -p migrations
    fi
    
    # Deploy to Cloud Run
    gcloud run deploy $BACKEND_SERVICE \
        --source . \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
        --memory 512Mi \
        --cpu 1 \
        --timeout 3600 \
        --max-instances 100 \
        --min-instances 1 \
        --set-cloudsql-instances "$PROJECT_ID:$REGION:edumath-db" \
        --entry-point="npm start"
    
    cd ..
    echo "✅ Backend deployed successfully!"
}

# Function to deploy frontend
deploy_frontend() {
    echo ""
    echo "🎨 Deploying Frontend..."
    
    cd frontend
    
    # Build the application
    echo "🔨 Building React app..."
    npm install
    npm run build
    
    # Deploy to Cloud Run
    gcloud run deploy $FRONTEND_SERVICE \
        --source . \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --memory 256Mi \
        --cpu 1 \
        --max-instances 100 \
        --min-instances 1 \
        --set-env-vars="VITE_API_BASE_URL=https://$BACKEND_SERVICE-$REGION.a.run.app"
    
    cd ..
    echo "✅ Frontend deployed successfully!"
}

# Function to show deployment status
show_status() {
    echo ""
    echo "📊 Deployment Status"
    echo "==================="
    
    echo ""
    echo "Backend Service:"
    gcloud run services describe $BACKEND_SERVICE --region $REGION 2>/dev/null || echo "  Not deployed"
    
    echo ""
    echo "Frontend Service:"
    gcloud run services describe $FRONTEND_SERVICE --region $REGION 2>/dev/null || echo "  Not deployed"
}

# Main script
case "${1:-all}" in
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

echo ""
echo "✨ Deployment complete!"
echo ""
echo "📌 Service URLs:"
gcloud run services list --region $REGION --format="table(SERVICE_NAME,URL)"
