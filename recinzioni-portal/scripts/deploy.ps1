<#
.SYNOPSIS
    Build e deploy completo del Portale Recinzioni su IIS.

.DESCRIPTION
    Esegue: backup versione attuale → build backend → build frontend →
    copia in publish → stop IIS → deploy → start IIS → health check.

.PARAMETER IISSitePath
    Cartella del sito IIS (default: C:\inetpub\wwwroot\recinzioni-portal)

.PARAMETER BackupPath
    Cartella backup (default: C:\backups\recinzioni-portal)

.PARAMETER AppPoolName
    Nome dell'Application Pool IIS (default: RecinzioniPortal)

.PARAMETER SkipBackup
    Salta il backup della versione attuale

.PARAMETER SkipFrontend
    Salta il build del frontend (deploy solo backend)

.PARAMETER SkipBackend
    Salta il build del backend (deploy solo frontend)

.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -IISSitePath "D:\sites\recinzioni" -AppPoolName "RecinzioniPool"
    .\deploy.ps1 -SkipBackend   # Solo frontend
#>

param(
    [string]$IISSitePath = "C:\inetpub\wwwroot\recinzioni-portal",
    [string]$BackupPath  = "C:\backups\recinzioni-portal",
    [string]$AppPoolName = "RecinzioniPortal",
    [switch]$SkipBackup,
    [switch]$SkipFrontend,
    [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# ─── Funzioni helper ─────────────────────────────────────────────────
function Write-Step([string]$msg) {
    Write-Host ""
    Write-Host "═══ $msg ═══" -ForegroundColor Cyan
}

function Write-Ok([string]$msg) {
    Write-Host "  ✓ $msg" -ForegroundColor Green
}

function Write-Warn([string]$msg) {
    Write-Host "  ⚠ $msg" -ForegroundColor Yellow
}

function Write-Fail([string]$msg) {
    Write-Host "  ✗ $msg" -ForegroundColor Red
}

# ─── Percorsi progetto ───────────────────────────────────────────────
$projectRoot   = Split-Path -Parent $PSScriptRoot
$backendDir    = Join-Path $projectRoot "backend\RecinzioniPortal.API"
$frontendDir   = Join-Path $projectRoot "frontend"
$publishDir    = Join-Path $backendDir "publish"
$wwwrootDir    = Join-Path $publishDir "wwwroot"

Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   Portale Recinzioni — Deploy $timestamp    ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""
Write-Host "Progetto:  $projectRoot"
Write-Host "IIS Path:  $IISSitePath"
Write-Host "App Pool:  $AppPoolName"
Write-Host "Backup:    $(if ($SkipBackup) { 'SKIP' } else { $BackupPath })"
Write-Host "Frontend:  $(if ($SkipFrontend) { 'SKIP' } else { 'BUILD' })"
Write-Host "Backend:   $(if ($SkipBackend) { 'SKIP' } else { 'BUILD' })"

# ─── Step 1: Backup ─────────────────────────────────────────────────
if (-not $SkipBackup -and (Test-Path $IISSitePath)) {
    Write-Step "Step 1/8: Backup versione attuale"
    $backupTarget = Join-Path $BackupPath "backup_$timestamp"
    New-Item -ItemType Directory -Path $backupTarget -Force | Out-Null
    Copy-Item -Path "$IISSitePath\*" -Destination $backupTarget -Recurse -Force
    Write-Ok "Backup creato in: $backupTarget"
} else {
    Write-Step "Step 1/8: Backup SKIP"
    if ($SkipBackup) { Write-Warn "Backup saltato su richiesta" }
    else { Write-Warn "Nessuna versione precedente trovata in $IISSitePath" }
}

# ─── Step 2: Pulizia cartella publish ─────────────────────────────────
Write-Step "Step 2/8: Pulizia cartella publish"
if (Test-Path $publishDir) {
    # Salva euritmo (archivio EDI) se esiste
    $euritmoDir = Join-Path $wwwrootDir "euritmo"
    $euritmoBak = $null
    if (Test-Path $euritmoDir) {
        $euritmoBak = Join-Path $env:TEMP "euritmo_bak_$timestamp"
        Copy-Item -Path $euritmoDir -Destination $euritmoBak -Recurse -Force
        Write-Ok "Backup euritmo in $euritmoBak"
    }
    Remove-Item -Path $publishDir -Recurse -Force
    Write-Ok "Cartella publish rimossa"
    # Ripristina euritmo
    if ($euritmoBak -and (Test-Path $euritmoBak)) {
        New-Item -ItemType Directory -Path $wwwrootDir -Force | Out-Null
        Copy-Item -Path $euritmoBak -Destination $euritmoDir -Recurse -Force
        Remove-Item -Path $euritmoBak -Recurse -Force
        Write-Ok "Cartella euritmo ripristinata"
    }
} else {
    Write-Ok "Nessuna cartella publish precedente"
}

# ─── Step 3: Build Backend ───────────────────────────────────────────
if (-not $SkipBackend) {
    Write-Step "Step 3/8: Build backend (.NET)"
    if (-not (Test-Path $backendDir)) {
        Write-Fail "Cartella backend non trovata: $backendDir"
        exit 1
    }
    Push-Location $backendDir
    try {
        dotnet publish -c Release -o $publishDir --no-restore 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            dotnet publish -c Release -o $publishDir 2>&1
            if ($LASTEXITCODE -ne 0) { throw "dotnet publish fallito" }
        }
        Write-Ok "Backend compilato in: $publishDir"
    } finally {
        Pop-Location
    }
} else {
    Write-Step "Step 3/8: Build backend SKIP"
}

# ─── Step 4: Build Frontend ─────────────────────────────────────────
if (-not $SkipFrontend) {
    Write-Step "Step 4/8: Build frontend (Vite + PWA)"
    if (-not (Test-Path $frontendDir)) {
        Write-Fail "Cartella frontend non trovata: $frontendDir"
        exit 1
    }
    Push-Location $frontendDir
    try {
        npm install 2>&1 | Out-Null
        npm run build 2>&1
        if ($LASTEXITCODE -ne 0) { throw "npm run build fallito" }
        Write-Ok "Frontend compilato"
    } finally {
        Pop-Location
    }
} else {
    Write-Step "Step 4/8: Build frontend SKIP"
}

# ─── Step 5: Copia frontend in wwwroot ───────────────────────────────
if (-not $SkipFrontend) {
    Write-Step "Step 5/8: Copia frontend in wwwroot"
    $distDir = Join-Path $frontendDir "dist"
    if (-not (Test-Path $distDir)) {
        Write-Fail "Cartella dist non trovata: $distDir"
        exit 1
    }
    if (-not (Test-Path $wwwrootDir)) {
        New-Item -ItemType Directory -Path $wwwrootDir -Force | Out-Null
    }
    # Pulisci vecchi asset frontend (preserva euritmo)
    $assetsDir = Join-Path $wwwrootDir "assets"
    if (Test-Path $assetsDir) { Remove-Item -Path $assetsDir -Recurse -Force }
    Get-ChildItem $wwwrootDir -Include "sw.js","workbox-*.js","index.html","manifest.webmanifest" -File -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "$distDir\*" -Destination $wwwrootDir -Recurse -Force
    Write-Ok "Frontend copiato in $wwwrootDir"
} else {
    Write-Step "Step 5/8: Copia frontend SKIP"
}

# ─── Step 6: Stop IIS App Pool ───────────────────────────────────────
Write-Step "Step 6/8: Stop IIS Application Pool"
try {
    Import-Module WebAdministration -ErrorAction Stop
    $pool = Get-WebAppPoolState -Name $AppPoolName -ErrorAction Stop
    if ($pool.Value -eq "Started") {
        Stop-WebAppPool -Name $AppPoolName
        Start-Sleep -Seconds 3
        Write-Ok "App Pool '$AppPoolName' fermato"
    } else {
        Write-Warn "App Pool '$AppPoolName' già in stato: $($pool.Value)"
    }
} catch {
    Write-Warn "Impossibile fermare App Pool (potrebbe non esistere ancora): $_"
}

# ─── Step 7: Deploy su IIS ───────────────────────────────────────────
Write-Step "Step 7/8: Deploy file su IIS"
if (-not (Test-Path $IISSitePath)) {
    New-Item -ItemType Directory -Path $IISSitePath -Force | Out-Null
}
Copy-Item -Path "$publishDir\*" -Destination $IISSitePath -Recurse -Force
Write-Ok "File deployati in: $IISSitePath"

# ─── Step 8: Start IIS App Pool + Health Check ───────────────────────
Write-Step "Step 8/8: Start IIS + Health Check"
try {
    Start-WebAppPool -Name $AppPoolName
    Start-Sleep -Seconds 5
    Write-Ok "App Pool '$AppPoolName' avviato"
} catch {
    Write-Warn "Impossibile avviare App Pool: $_"
}

# Health check
try {
    $baseUrl = "http://localhost"
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Write-Ok "Health check: $($response.status) | DB: $($response.database) | v$($response.version)"
    } else {
        Write-Warn "Health check: $($response.status) | DB: $($response.database)"
    }
} catch {
    Write-Warn "Health check non raggiungibile (verificare manualmente): $_"
}

# ─── Report finale ───────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║             Deploy completato!                   ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Prossimi passi:"
Write-Host "  1. Verificare il sito nel browser"
Write-Host "  2. Testare login e funzionalita' principali"
Write-Host "  3. Verificare installabilita' PWA (Chrome > Installa app)"
Write-Host "  4. DevTools > Application > Service Workers (verificare registrazione)"
Write-Host ""
