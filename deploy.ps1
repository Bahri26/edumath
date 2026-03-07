# Edumath Optimized Final Deploy Script
param()

$ErrorActionPreference = 'Stop'

$PROJECT_ID = "project-ef733f7a-3171-45c7-b29"
$REGION = "us-central1"
$DB_INST = "project-ef733f7a-3171-45c7-b29:us-central1:edumath-db"
$SECRET_DB_PASSWORD = "edumath-db-password"
$SECRET_JWT_SECRET = "edumath-jwt-secret"
$SECRET_GEMINI_API_KEY = "edumath-gemini-api-key"
$SERVICE_ACCOUNT = "edumath-run-sa@project-ef733f7a-3171-45c7-b29.iam.gserviceaccount.com"
$SERVICE_NAME = "edumath-app" # Artık her şey bu ismin altında çalışacak

Write-Host "`n=== EDUMATH DEPLOYMENT STARTED ===" -ForegroundColor Cyan

function Get-EnvValueFromFile {
    param(
        [string]$FilePath,
        [string]$Key
    )

    if (!(Test-Path $FilePath)) { return $null }
    $line = Get-Content $FilePath | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if (!$line) { return $null }

    $value = $line.Substring($line.IndexOf('=') + 1).Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Trim('"')
    }
    return $value
}

function Ensure-GcpSecret {
    param(
        [string]$SecretName,
        [string]$SecretValue,
        [string]$ProjectId
    )

    if ([string]::IsNullOrWhiteSpace($SecretValue)) {
        Write-Error "Secret değeri boş: $SecretName. backend/.env dosyasında eksik olabilir."
        exit 1
    }

    gcloud secrets describe $SecretName --project $ProjectId --quiet *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Secret oluşturuluyor: $SecretName" -ForegroundColor Yellow
        $SecretValue | gcloud secrets create $SecretName --replication-policy="automatic" --data-file=- --project $ProjectId --quiet
    } else {
        Write-Host "Secret güncelleniyor: $SecretName (new version)" -ForegroundColor Yellow
        $SecretValue | gcloud secrets versions add $SecretName --data-file=- --project $ProjectId --quiet
    }
}

# 1. Kontrol: Gcloud CLI
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI bulunamadı!"
    exit 1
}
gcloud config set project $PROJECT_ID --quiet

# 2. Secret'ları doğrula/oluştur
Write-Host "`n--- 0/4: Secret Manager doğrulanıyor ---" -ForegroundColor Yellow
$backendEnvPath = Join-Path $PSScriptRoot "backend/.env"
$dbPassword = Get-EnvValueFromFile -FilePath $backendEnvPath -Key "DB_PASSWORD"
$jwtSecret = Get-EnvValueFromFile -FilePath $backendEnvPath -Key "JWT_SECRET"
$geminiApiKey = Get-EnvValueFromFile -FilePath $backendEnvPath -Key "GEMINI_API_KEY"

Ensure-GcpSecret -SecretName $SECRET_DB_PASSWORD -SecretValue $dbPassword -ProjectId $PROJECT_ID
Ensure-GcpSecret -SecretName $SECRET_JWT_SECRET -SecretValue $jwtSecret -ProjectId $PROJECT_ID
Ensure-GcpSecret -SecretName $SECRET_GEMINI_API_KEY -SecretValue $geminiApiKey -ProjectId $PROJECT_ID

# 3. Backend Deploy (Önce backend, sonra frontend build)
Write-Host "`n--- 1/4: Backend Deploy Ediliyor ---" -ForegroundColor Yellow
$BACKEND_API_NAME = "edumath-api"
$BACKEND_PATH = "$PSScriptRoot/backend"

Push-Location $BACKEND_PATH
gcloud run deploy $BACKEND_API_NAME `
    --source . `
    --clear-base-image `
    --region $REGION `
    --project $PROJECT_ID `
    --service-account $SERVICE_ACCOUNT `
    --add-cloudsql-instances $DB_INST `
    --update-env-vars "NODE_ENV=production,DB_NAME=edumath,DB_USER=BahriAdmin,INSTANCE_CONNECTION_NAME=$DB_INST,DB_HOST=/cloudsql/$DB_INST,GEMINI_MODEL=gemini-2.5-flash" `
    --remove-env-vars "DB_PASSWORD,JWT_SECRET,GEMINI_API_KEY" `
    --set-secrets "DB_PASSWORD=${SECRET_DB_PASSWORD}:latest,JWT_SECRET=${SECRET_JWT_SECRET}:latest,GEMINI_API_KEY=${SECRET_GEMINI_API_KEY}:latest" `
    --allow-unauthenticated `
    --quiet
if ($LASTEXITCODE -ne 0) { throw "Backend deploy failed" }
$BACKEND_API_URL = gcloud run services describe $BACKEND_API_NAME --format='value(status.url)' --region $REGION
if ($LASTEXITCODE -ne 0) { throw "Backend URL read failed" }
Pop-Location

# 4. Frontend Build (Backend URL ile)
Write-Host "`n--- 2/4: Frontend Hazırlanıyor ---" -ForegroundColor Yellow
$FRONTEND_PATH = "$PSScriptRoot/frontend"
if (Test-Path $FRONTEND_PATH) {
    Push-Location $FRONTEND_PATH
    npm install
    npm run build
    Pop-Location
} else {
    Write-Error "Frontend klasörü bulunamadı! İşlem iptal ediliyor."
    exit 1
}

# 5. Dosyaları Birleştirme (Frontend dist -> Backend dist)
Write-Host "`n--- 3/4: Dosyalar Birleştiriliyor ---" -ForegroundColor Yellow
$BACKEND_DIST = "$PSScriptRoot/backend/dist"
$FRONTEND_DIST = "$PSScriptRoot/frontend/dist"
if (Test-Path $BACKEND_DIST) { Remove-Item -Recurse -Force $BACKEND_DIST }
New-Item -ItemType Directory -Path $BACKEND_DIST | Out-Null
Copy-Item -Path "$FRONTEND_DIST\*" -Destination $BACKEND_DIST -Recurse
Write-Host "Frontend build dosyaları backend'e başarıyla kopyalandı." -ForegroundColor Green

# 6. Tek ve Ana Deployment (Backend + Frontend Birlikte)
Write-Host "`n--- 4/4: Buluta Yükleniyor (Cloud Run) ---" -ForegroundColor Yellow
Push-Location $BACKEND_PATH
gcloud run deploy $SERVICE_NAME `
    --source . `
    --clear-base-image `
    --region $REGION `
    --project $PROJECT_ID `
    --service-account $SERVICE_ACCOUNT `
    --add-cloudsql-instances $DB_INST `
    --update-env-vars "NODE_ENV=production,DB_NAME=edumath,DB_USER=BahriAdmin,INSTANCE_CONNECTION_NAME=$DB_INST,DB_HOST=/cloudsql/$DB_INST,GEMINI_MODEL=gemini-2.5-flash" `
    --remove-env-vars "DB_PASSWORD,JWT_SECRET,GEMINI_API_KEY" `
    --set-secrets "DB_PASSWORD=${SECRET_DB_PASSWORD}:latest,JWT_SECRET=${SECRET_JWT_SECRET}:latest,GEMINI_API_KEY=${SECRET_GEMINI_API_KEY}:latest" `
    --allow-unauthenticated `
    --quiet
if ($LASTEXITCODE -ne 0) { throw "Final app deploy failed" }
$FINAL_URL = gcloud run services describe $SERVICE_NAME --format='value(status.url)' --region $REGION
if ($LASTEXITCODE -ne 0) { throw "Final URL read failed" }
Pop-Location

Write-Host "`n=== TÜM SİSTEM BAŞARIYLA YAYINDA ===" -ForegroundColor Cyan
Write-Host "Uygulama Adresi: $FINAL_URL" -ForegroundColor Magenta