# Google Cloud SQL'e erişim yetkisi ver ve Proxy başlat
# Bu script gcloud CLI kullanarak Cloud SQL Proxy v2 başlatır

Write-Host "Google Cloud SQL Proxy v2 başlatılıyor..." -ForegroundColor Green

# Gcloud CLI ile Cloud SQL Proxy başlat
# (gcloud CLI zaten yüklenmiş olmalı)
gcloud auth login

gcloud sql connect edumath-db `
    --project=project-ef733f7a-3171-45c7-b29 `
    --user=BahriAdmin `
    --port=3306

# Alternatif: Cloud SQL Auth Proxy v2 indir ve çalıştır
# https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases
