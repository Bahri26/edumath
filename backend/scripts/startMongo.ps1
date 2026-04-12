# Start local MongoDB on Windows
# Tries to start Windows service; if not found, attempts to run mongod directly.

param(
    [string]$DbPath = "C:\\data\\db"
)

Write-Host "Looking for MongoDB Windows service..."
$svc = Get-Service | Where-Object { $_.Name -match "MongoDB" }
if ($svc) {
    if ($svc.Status -ne 'Running') {
        Write-Host "Starting MongoDB service: $($svc.Name)"
        Start-Service -Name $svc.Name
    } else {
        Write-Host "MongoDB service already running: $($svc.Name)"
    }
    exit 0
}

Write-Host "Service not found. Trying mongod executable..."
$mongod = Get-Command mongod -ErrorAction SilentlyContinue
if (-not $mongod) {
    Write-Error "mongod not found in PATH. Please install MongoDB Community Server or add mongod to PATH."
    exit 1
}

# Ensure dbPath exists
if (-not (Test-Path -Path $DbPath)) {
    Write-Host "Creating data directory at $DbPath"
    New-Item -ItemType Directory -Path $DbPath | Out-Null
}

Write-Host "Starting mongod at $DbPath (Ctrl+C to stop)"
& $mongod.Path --dbpath $DbPath --bind_ip 127.0.0.1
