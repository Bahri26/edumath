# AI-FastAPI Project Structure Setup Script

Write-Host "Creating AI-FastAPI directory structure..." -ForegroundColor Green

# Ana klasörler
$folders = @(
    "app",
    "app\models",
    "app\routers",
    "app\services",
    "app\middleware",
    "app\utils",
    "app\ml_models",
    "tests",
    "tests\unit",
    "tests\integration",
    "data",
    "data\training",
    "data\cache"
)

foreach ($folder in $folders) {
    $path = "ai-fastapi\$folder"
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "  Created: $path" -ForegroundColor Cyan
    }
}

# __init__.py dosyaları oluştur
$initFiles = @(
    "app\__init__.py",
    "app\models\__init__.py",
    "app\routers\__init__.py",
    "app\services\__init__.py",
    "app\middleware\__init__.py",
    "app\utils\__init__.py",
    "tests\__init__.py"
)

foreach ($file in $initFiles) {
    $path = "ai-fastapi\$file"
    if (-not (Test-Path $path)) {
        '"""' | Out-File -FilePath $path -Encoding UTF8
        "Package initialization" | Out-File -FilePath $path -Append -Encoding UTF8
        '"""' | Out-File -FilePath $path -Append -Encoding UTF8
        Write-Host "  Created: $path" -ForegroundColor Yellow
    }
}

Write-Host "`nDirectory structure created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Magenta
Write-Host "  1. cd ai-fastapi"
Write-Host "  2. python -m venv venv"
Write-Host "  3. venv\Scripts\activate"
Write-Host "  4. pip install -r requirements.txt"
Write-Host "  5. cp .env.example .env  (and configure)"
Write-Host "  6. uvicorn main:app --reload --port 8001"
