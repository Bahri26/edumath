# MongoDB Atlas Migration Script
# Bu script yerel MongoDB'den Atlas'a veri taşımayı otomatikleştirir

$atlasUser = "bahrikoc1996_db_user"
$atlasPassword = "N9TsJQ6P1J6rWsIJThy"
$atlasCluster = "cluster0.zylekzm.mongodb.net"
$dbName = "edumathDB"

# Atlas connection URI (şifre URL encode edilmiş)
$atlasUri = "mongodb+srv://${atlasUser}:${atlasPassword}@${atlasCluster}/${dbName}?retryWrites=true&w=majority&appName=Cluster0"

Write-Host "=== MongoDB Atlas Migration Script ===" -ForegroundColor Cyan
Write-Host ""

# 1. Dump klasoru olustur
Write-Host "1. Dump klasoru olusturuluyor..." -ForegroundColor Yellow
$dumpPath = Join-Path $PSScriptRoot "dump"
if (Test-Path $dumpPath) {
    Remove-Item $dumpPath -Recurse -Force
}
New-Item -ItemType Directory -Path $dumpPath -Force | Out-Null
Write-Host "   OK Dump klasoru hazir: $dumpPath" -ForegroundColor Green
Write-Host ""

# 2. MongoDB dump al
Write-Host "2. Yerel MongoDB'den veri aliniyor..." -ForegroundColor Yellow
Write-Host "   Database: $dbName" -ForegroundColor Gray
try {
    $dumpOutput = mongodump --db $dbName --out $dumpPath 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK Veri basariyla disa aktarildi" -ForegroundColor Green
        
        # Dump edilen koleksiyonlari listele
        $collections = Get-ChildItem -Path "$dumpPath\$dbName" -Filter "*.bson" | Select-Object -ExpandProperty BaseName
        Write-Host "   OK Koleksiyonlar: $($collections -join ', ')" -ForegroundColor Green
    } else {
        throw "mongodump basarisiz oldu"
    }
} catch {
    Write-Host "   X HATA: mongodump komutu bulunamadi veya basarisiz oldu" -ForegroundColor Red
    Write-Host "   MongoDB Database Tools'u yukleyin: https://www.mongodb.com/try/download/database-tools" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 3. Atlas'a restore
Write-Host "3. Atlas'a veri yukleniyor..." -ForegroundColor Yellow
Write-Host "   Hedef: $atlasCluster/$dbName" -ForegroundColor Gray
try {
    $restoreOutput = mongorestore --uri $atlasUri --db $dbName "$dumpPath\$dbName" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK Veri basariyla Atlas'a yuklendi" -ForegroundColor Green
    } else {
        throw "mongorestore basarisiz oldu: $restoreOutput"
    }
} catch {
    Write-Host "   X HATA: Restore basarisiz" -ForegroundColor Red
    Write-Host "   Detay: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Olasi nedenler:" -ForegroundColor Yellow
    Write-Host "   - IP adresi whitelist'te degil (Atlas Network Access)" -ForegroundColor Gray
    Write-Host "   - Kullanici adi/sifre yanlis" -ForegroundColor Gray
    Write-Host "   - Cluster URI yanlis" -ForegroundColor Gray
    exit 1
}
Write-Host ""

# 4. Basari mesaji
Write-Host "=== Migration Tamamlandi! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Sonraki Adimlar:" -ForegroundColor Cyan
Write-Host "1. backend-express/.env dosyasindaki MONGO_URI'yi guncelleyin:" -ForegroundColor White
Write-Host "   MONGO_URI=$atlasUri" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Backend'i yeniden baslatin:" -ForegroundColor White
Write-Host "   cd backend-express" -ForegroundColor Gray
Write-Host "   node server.js" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Baglanti test edin:" -ForegroundColor White
Write-Host "   Invoke-WebRequest http://localhost:8000/api/health" -ForegroundColor Gray
Write-Host ""
