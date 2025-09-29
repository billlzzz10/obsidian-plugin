Write-Host "Starting backend setup and run script..."

$ErrorActionPreference = 'Stop'

# Resolve desired venv path (override with VENV_PATH, default to .\venv)
$defaultVenv = Join-Path $PSScriptRoot 'venv'
$venvPath = if ($env:VENV_PATH -and $env:VENV_PATH.Trim()) { $env:VENV_PATH } else { $defaultVenv }

# Helper: Try to create a venv with a given Python launcher and path
function New-AppVenv {
    param(
        [Parameter(Mandatory=$true)][string]$Launcher,
        [Parameter(Mandatory=$true)][string]$Path
    )
    if (Test-Path $Path) {
        Write-Host "Removing existing venv at $Path ..."
        for ($i=0; $i -lt 3; $i++) {
            try {
                Remove-Item -Recurse -Force $Path -ErrorAction Stop
                break
            } catch {
                Write-Host "Retry remove attempt $($i+1) failed: $($_.Exception.Message)" -ForegroundColor Yellow
                Start-Sleep -Milliseconds 500
            }
        }
        if (Test-Path $Path) {
            try {
                [System.IO.Directory]::Delete($Path, $true)
            } catch {
                Write-Host "Final directory delete attempt failed; continuing (may reuse existing env)" -ForegroundColor Yellow
            }
        }
    }
    if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null }
    Write-Host "Creating virtual environment with $Launcher at $Path ..."
    & $Launcher -m venv $Path
    return $LASTEXITCODE
}

# Detect available Python launcher
$pythonLaunchers = @('py -3.11', 'py -3', 'python')
$created = $false
$attemptLog = @()

foreach ($launcher in $pythonLaunchers) {
    try {
        $null = & $launcher --version 2>$null
        if ($LASTEXITCODE -ne 0) { $attemptLog += "Skip $launcher (not available)"; continue }
    } catch { $attemptLog += "Skip $launcher (not available)"; continue }

    # First attempt: requested (or default) path inside repo
    $code = New-AppVenv -Launcher $launcher -Path $venvPath
    if ($code -eq 0) { $created = $true; break }
    $attemptLog += "Failed with $launcher at $venvPath (exit $code)"

    # Fallback: LOCALAPPDATA path (avoids network/OneDrive locks)
    $fallback = Join-Path $env:LOCALAPPDATA 'venvs\obsidian_backend'
    $code = New-AppVenv -Launcher $launcher -Path $fallback
    if ($code -eq 0) { $venvPath = $fallback; $created = $true; break }
    $attemptLog += "Failed with $launcher at $fallback (exit $code)"
}

if (-not $created) {
    Write-Error ("Failed to create virtual environment with any launcher. Attempts: `n" + ($attemptLog -join "`n"))
    Write-Error "Tips: Run PowerShell as Administrator, ensure antivirus/OneDrive isn't locking the folder, or set VENV_PATH to a writable directory (e.g., `$env:LOCALAPPDATA\\venvs\\obsidian_backend)."
    exit 1
}

# Allow script execution in this session
Write-Host "Setting execution policy for this session..."
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# Load environment variables from .env
if (Test-Path ".\.env") {
    Write-Host "Loading environment variables from .env"
    Get-Content .\.env | ForEach-Object {
        if ($_ -and ($_ -notmatch '^\s*#') -and ($_ -match '=')) {
            $pair = $_.Split('=',2)
            $key = $pair[0].Trim()
            $value = $pair[1].Trim().Trim('"')
            if ($key) { [System.Environment]::SetEnvironmentVariable($key, $value, 'Process') }
        }
    }
}

# Provide sane defaults if not set
if (-not $env:HOST -or -not $env:HOST.Trim()) { $env:HOST = '127.0.0.1' }
if (-not $env:PORT -or -not $env:PORT.Trim()) { $env:PORT = '8000' }

# Define python executable path inside venv
$venvExe = Join-Path $venvPath "Scripts\python.exe"
if (-Not (Test-Path $venvExe)) {
    Write-Error "Python executable not found at $venvExe"
    exit 1
}
Write-Host "Using venv at: $venvPath"

Write-Host "Upgrading pip, setuptools, wheel..."
& $venvExe -m pip install --upgrade pip setuptools wheel

Write-Host "Detecting Python version inside venv..."
$verJson = & $venvExe -c "import sys, json; print(json.dumps({'major': sys.version_info[0], 'minor': sys.version_info[1]}))"
$pyVer = $null
try { $pyVer = $verJson | ConvertFrom-Json } catch { }
if (-not $pyVer) { Write-Host "Warning: Could not parse Python version, proceeding with default numpy" }

$numpyVersion = $null
if ($pyVer -and $pyVer.major -eq 3) {
    switch ($pyVer.minor) {
        11 { $numpyVersion = '1.24.3' }
        12 { $numpyVersion = '1.26.4' }
        13 { $numpyVersion = '2.1.3' }
        Default { $numpyVersion = $null }
    }
}

if ($numpyVersion) {
    Write-Host "Installing numpy binary wheel ($numpyVersion) ..."
    & $venvExe -m pip install --only-binary=:all: numpy==$numpyVersion
} else {
    Write-Host "Installing latest numpy binary wheel ..."
    & $venvExe -m pip install --only-binary=:all: numpy
}

Write-Host "Installing backend dependencies (prefer binary wheels)..."
& $venvExe -m pip install --prefer-binary -r requirements.txt

# Start Uvicorn server using HOST and PORT from .env
Write-Host "Running backend server on $env:HOST:$env:PORT ..."
& $venvExe -m uvicorn src.main:app --reload --host $env:HOST --port $env:PORT
