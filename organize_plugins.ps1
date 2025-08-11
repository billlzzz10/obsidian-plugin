param(
    [switch]$ListOnly = $true,
    [string[]]$ArchiveNames = @(),
    [switch]$Cleanup = $true,
    [switch]$IncludeSelf = $false,
    [switch]$ArchiveAll = $false
)

$ErrorActionPreference = 'Stop'

# Determine plugins root (parent of this plugin folder)
$pluginsRoot = Split-Path $PSScriptRoot -Parent
$archiveRoot = Join-Path $pluginsRoot '_archive'

if (!(Test-Path $archiveRoot)) {
    New-Item -ItemType Directory -Path $archiveRoot | Out-Null
}

# Collect plugin directories with manifest.json
$selfFolder = Split-Path $PSScriptRoot -Leaf

$plugins = Get-ChildItem -Path $pluginsRoot -Directory |
    Where-Object {
        $_.Name -ne '_archive' -and (Test-Path (Join-Path $_.FullName 'manifest.json')) -and (
            $IncludeSelf -or $_.Name -ne $selfFolder
        )
    } |
    ForEach-Object {
        $manifestPath = Join-Path $_.FullName 'manifest.json'
        $manifest = $null
        try { $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json } catch { }
        [PSCustomObject]@{
            Folder   = $_.Name
            Path     = $_.FullName
            Id       = $manifest.id
            Name     = $manifest.name
            Version  = $manifest.version
            Manifest = $manifestPath
        }
    }

if ($ListOnly) {
    Write-Host 'Installed plugins:' -ForegroundColor Cyan
    $plugins | Sort-Object Folder | Format-Table Folder, Id, Name, Version -AutoSize
    Write-Host "`nTo archive: run with -ListOnly:$false -ArchiveNames @('folder1','folder2') [-Cleanup:$true]" -ForegroundColor Yellow
    return
}

if (-not $ArchiveNames -or $ArchiveNames.Count -eq 0) {
    if ($ArchiveAll) {
        $ArchiveNames = $plugins.Folder
    } else {
        Write-Error 'No plugin folder names specified to archive. Use -ArchiveNames or -ArchiveAll.'
        exit 1
    }
}

$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$indexPath = Join-Path $archiveRoot 'INDEX.md'

foreach ($name in $ArchiveNames) {
    $match = $plugins | Where-Object { $_.Folder -eq $name }
    if (-not $match) {
        Write-Warning "Plugin folder not found or missing manifest: $name"
        continue
    }

    $target = Join-Path $archiveRoot $match.Folder
    if (Test-Path $target) {
        $target = Join-Path $archiveRoot ("{0}_{1}" -f $match.Folder, $timestamp)
    }

    Write-Host ("Archiving {0} (id={1}) -> {2}" -f $match.Folder, $match.Id, $target) -ForegroundColor Green
    Move-Item -Path $match.Path -Destination $target

    $entry = @()
    $entry += ("- {0} | id: `{1}` | ver: {2} | archived: {3}" -f $match.Name, $match.Id, $match.Version, (Get-Date))
    $entry += ("  - from: `{0}`" -f $match.Path)
    $entry += ("  - to: `{0}`" -f $target)
    Add-Content -Path $indexPath -Value ($entry -join "`n") -Encoding UTF8

    if ($Cleanup) {
        Write-Host "Cleaning junk files in archived plugin..." -ForegroundColor DarkCyan
        $junkPatterns = @(
            'node_modules', '.cache', '.parcel-cache', '.vite', '.turbo', 'coverage', 'dist/*.map',
            '.eslintcache', '.DS_Store', 'Thumbs.db', '*.log', '*.tmp', '*.bak'
        )
        foreach ($pat in $junkPatterns) {
            Get-ChildItem -Path (Join-Path $target $pat) -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
                try { Remove-Item -Recurse -Force $_.FullName -ErrorAction Stop } catch { }
            }
        }
    }
}

Write-Host "Done. See $indexPath" -ForegroundColor Cyan
