# Homepage Test Script
# Bu script homepage endpoint'lerini test eder

Write-Host "=== EduMath Homepage Test ===" -ForegroundColor Cyan
Write-Host ""

# Backend URL
$baseUrl = "http://localhost:8000"

# Token'ı kullanıcıdan al
Write-Host "Adım 1: Token Al" -ForegroundColor Yellow
Write-Host "Browser'da http://localhost:5173 aç, öğretmen olarak giriş yap"
Write-Host "DevTools > Application > Local Storage > token değerini kopyala"
Write-Host ""
$token = Read-Host "Token'ı buraya yapıştır"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Token boş olamaz!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "=== Test Başlıyor ===" -ForegroundColor Green
Write-Host ""

# Header'ları hazırla
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 1: Analytics
Write-Host "Test 1: Analytics Teacher Summary" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/teacher/summary" -Headers $headers -Method Get
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Surveys
Write-Host "Test 2: Surveys List" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/surveys" -Headers $headers -Method Get
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    if ($response.Count -gt 0) {
        Write-Host "Found $($response.Count) surveys" -ForegroundColor Gray
        $response[0] | ConvertTo-Json -Depth 2
    } else {
        Write-Host "No surveys found (empty array)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Leaderboard
Write-Host "Test 3: Leaderboard" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/leaderboard?period=week&limit=5" -Headers $headers -Method Get
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    if ($response.Count -gt 0) {
        Write-Host "Found $($response.Count) leaders" -ForegroundColor Gray
        $response | ConvertTo-Json -Depth 2
    } else {
        Write-Host "No leaders found (empty array)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Exams
Write-Host "Test 4: Upcoming Exams" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/exams?status=active" -Headers $headers -Method Get
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    if ($response.Count -gt 0) {
        Write-Host "Found $($response.Count) active exams" -ForegroundColor Gray
    } else {
        Write-Host "No active exams found" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Test Tamamlandı ===" -ForegroundColor Green
Write-Host ""
Write-Host "Sonraki Adım: Browser'da http://localhost:5173 kontrol et" -ForegroundColor Yellow
