# JARVIS AI SYSTEM - FULL PROJECT ARCHITECT (2026)
# Run with: irm https://your-domain/jarvis-install.ps1 | iex
#   or:     powershell -ExecutionPolicy Bypass -File jarvis-install.ps1

$ErrorActionPreference = "Stop"

$JARVIS_ROOT = "$HOME\Documents\Jarvis"
Write-Host "--- JARVIS: TOTAL PROJECT INSTALLATION STARTING ---" -ForegroundColor Cyan

# STEP 1: Software Requirements (Winget)
Write-Host "`n[1/4] Installing Core Binaries..." -ForegroundColor Yellow
$apps = @("Git.Git", "OpenJS.NodeJS.LTS", "Python.Python.3.12", "Obsidian.Obsidian", "Ollama.Ollama")
foreach ($app in $apps) {
    Write-Host " Ensuring $app..." -NoNewline
    winget install --id $app --exact --silent --accept-source-agreements --accept-package-agreements > $null
    Write-Host " [DONE]" -ForegroundColor Green
}

# STEP 2: File System Architecture
Write-Host "`n[2/4] Constructing Project Directory..." -ForegroundColor Yellow
$folders = @(
    "app\electron-ui", "core", "integrations\openclaw", "integrations\telegram",
    "scripts", "config", "logs", "JarvisVault\00_System", "JarvisVault\01_Models"
)
foreach ($f in $folders) {
    $path = Join-Path $JARVIS_ROOT $f
    if (!(Test-Path $path)) { New-Item -Path $path -ItemType Directory -Force | Out-Null }
}
Set-Location $JARVIS_ROOT

# STEP 3: Injecting Core Configuration
Write-Host "`n[3/4] Injecting Core Configuration Files..." -ForegroundColor Yellow

# Create tools_config.json
$toolsConfig = @"
{
  "system": "Windows",
  "tools": [
    {"name": "cmd", "executor": "powershell", "permission_level": "Standard"},
    {"name": "obsidian_write", "executor": "rest_api", "endpoint": "http://127.0.0.1:27124/note/"}
  ]
}
"@
$toolsConfig | Out-File -FilePath "config\tools_config.json"

# Create a basic package.json for Electron
Set-Location "app\electron-ui"
if (!(Test-Path "package.json")) {
    npm init -y > $null
    npm install electron --save-dev > $null
}
Set-Location $JARVIS_ROOT

# STEP 4: Initializing AI Brain (Ollama)
Write-Host "`n[4/4] Waking up Ollama & Pulling Models..." -ForegroundColor Yellow
Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5
ollama pull phi3  # Fast model for initial testing

Write-Host "`n--- INSTALLATION COMPLETE ---" -ForegroundColor Cyan
Write-Host "Project Location: $JARVIS_ROOT"
Write-Host "1. Restart your PC to refresh Environment Variables."
Write-Host "2. Open Obsidian and select $JARVIS_ROOT\JarvisVault"
Write-Host "3. Run 'Jarvis.exe' or 'jarvis_boot.ps1' to start."
