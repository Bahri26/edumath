param(
    [string]$BackendHealthUrl = "http://localhost:3000/api/health",
    [string]$FrontendUrl = "http://localhost:5173",
    [int]$ProxyPort = 3306,
    [int]$TimeoutSec = 4
)

$ErrorActionPreference = 'SilentlyContinue'

function Write-StatusLine {
    param(
        [string]$CheckName,
        [bool]$IsOk,
        [string]$Details
    )

    $mark = if ($IsOk) { '[OK]' } else { '[FAIL]' }
    Write-Host ("{0} {1}: {2}" -f $mark, $CheckName, $Details)
}

function Test-HttpEndpoint {
    param(
        [string]$Url,
        [int]$RequestTimeoutSec = 4
    )

    try {
        $resp = Invoke-WebRequest -Method GET -Uri $Url -TimeoutSec $RequestTimeoutSec -UseBasicParsing
        return @{ ok = ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400); code = $resp.StatusCode }
    } catch {
        return @{ ok = $false; code = $null }
    }
}

function Test-TcpEndpoint {
    param(
        [string]$TargetAddress,
        [int]$TargetPort
    )

    try {
        $tnc = Test-NetConnection -ComputerName $TargetAddress -Port $TargetPort -WarningAction SilentlyContinue
        return [bool]$tnc.TcpTestSucceeded
    } catch {
        return $false
    }
}

Write-Host '=== EduMath Local Stack Check ==='
Write-Host ("Time: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))

$proxyOk = Test-TcpEndpoint -TargetAddress '127.0.0.1' -TargetPort $ProxyPort
Write-StatusLine -CheckName "Cloud SQL Proxy (127.0.0.1:$ProxyPort)" -IsOk $proxyOk -Details ($(if ($proxyOk) { 'Listening' } else { 'Not listening' }))

$backend = Test-HttpEndpoint -Url $BackendHealthUrl -RequestTimeoutSec $TimeoutSec
Write-StatusLine -CheckName 'Backend Health' -IsOk ([bool]$backend.ok) -Details ($(if ($backend.ok) { "HTTP $($backend.code)" } else { 'No response' }))

$frontend = Test-HttpEndpoint -Url $FrontendUrl -RequestTimeoutSec $TimeoutSec
Write-StatusLine -CheckName 'Frontend Dev Server' -IsOk ([bool]$frontend.ok) -Details ($(if ($frontend.ok) { "HTTP $($frontend.code)" } else { 'No response' }))

$allOk = $proxyOk -and [bool]$backend.ok -and [bool]$frontend.ok

if ($allOk) {
    Write-Host "`nStack result: READY"
    exit 0
}

Write-Host "`nStack result: NOT READY"
Write-Host 'Tips:'
if (-not $proxyOk) { Write-Host '- Proxy baslat: .\\cloud-sql-proxy.exe -instances=project-ef733f7a-3171-45c7-b29:us-central1:edumath-db=tcp:3306' }
if (-not [bool]$backend.ok) { Write-Host '- Backend baslat: cd backend; npm start' }
if (-not [bool]$frontend.ok) { Write-Host '- Frontend baslat: cd frontend; npm run dev' }

exit 1
