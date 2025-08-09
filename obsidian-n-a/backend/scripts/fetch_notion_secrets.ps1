param(
  [Parameter(Mandatory=$true)][string]$NotionToken,
  [Parameter(Mandatory=$true)][string]$DatabaseId,
  [string]$KeyProperty = "Key",
  [string]$ValueProperty = "Value",
  [switch]$SetUserEnv # ใช้ Setx สำหรับผู้ใช้ปัจจุบัน (ต้องเปิด VS Code/เทอร์มินัลใหม่)
)

$ErrorActionPreference = 'Stop'

$Headers = @{
  "Authorization"  = "Bearer $NotionToken"
  "Notion-Version" = "2022-06-28"
  "Content-Type"   = "application/json"
}

$Body = "{}"
$Url = "https://api.notion.com/v1/databases/$DatabaseId/query"

try {
  $resp = Invoke-RestMethod -Uri $Url -Headers $Headers -Method Post -Body $Body
} catch {
  Write-Error "เรียก Notion API ไม่ได้: $($_.Exception.Message)"; exit 1
}

if (-not $resp.results) { Write-Host "ไม่พบรายการในฐานข้อมูล"; exit 0 }

function Get-Text($p) {
  if ($null -eq $p) { return "" }
  switch ($p.type) {
    "title"       { if ($p.title.Count -gt 0) { return ($p.title | ForEach-Object {$_.plain_text}) -join "" } }
    "rich_text"   { if ($p.rich_text.Count -gt 0) { return ($p.rich_text | ForEach-Object {$_.plain_text}) -join "" } }
    "url"         { return $p.url }
    "email"       { return $p.email }
    "phone_number"{ return $p.phone_number }
    "number"      { return [string]$p.number }
    "select"      { if ($p.select) { return $p.select.name } }
    "multi_select"{ if ($p.multi_select) { return ($p.multi_select | ForEach-Object {$_.name}) -join "," } }
    default        { return "" }
  }
  return ""
}

$setCount = 0
foreach ($row in $resp.results) {
  $props = $row.properties
  if (-not $props.ContainsKey($KeyProperty) -or -not $props.ContainsKey($ValueProperty)) { continue }
  $k = Get-Text $props.$KeyProperty
  $v = Get-Text $props.$ValueProperty
  if ([string]::IsNullOrWhiteSpace($k) -or [string]::IsNullOrWhiteSpace($v)) { continue }

  # ตั้ง ENV ชั่วคราวในเซสชันนี้
  $env:${k} = $v
  $setCount++
  Write-Host "Set session env: $k"

  if ($SetUserEnv) {
  setx "$k" "$v" | Out-Null
    Write-Host "Set user env (persistent): $k"
  }
}

Write-Host "เสร็จสิ้น ($setCount คีย์)"
