<#
 .SYNOPSIS
  Automates creation (idempotent) of Azure resources + Federated Credential for GitHub Actions OIDC and outputs JSON for AZURE_CREDENTIALS_JSON secret.

 .DESCRIPTION
  Steps performed:
    1. Ensure az CLI available & logged in
    2. Select subscription
    3. Create Resource Group (if missing)
    4. Create (or reuse) Azure AD App Registration (service principal) – passwordless
    5. Assign Contributor role scope to Resource Group (optional: can narrow later)
    6. Create (or reuse) Federated Credential mapping GitHub repo + branch
    7. Emit minimal JSON { clientId, tenantId, subscriptionId } for GitHub secret

  Safe to re-run; it will skip existing objects.

 .PARAMETER SubscriptionId
  Azure Subscription ID.

 .PARAMETER ResourceGroup
  Resource Group name for deployment scope / role assignment.

 .PARAMETER Location
  Azure region (e.g. southeastasia).

 .PARAMETER AppName
  Display name for the App Registration (e.g. obsidian-backend-deploy). Avoid spaces.

 .PARAMETER GitHubOrg
  GitHub organization or user owning the repo.

 .PARAMETER GitHubRepo
  Repository name.

 .PARAMETER GitHubBranch
  Branch name (default: main) to bind federated credential (subject pattern).

 .PARAMETER OutputJsonPath
  Path to write JSON for GitHub secret (default: ./azure_credentials.json)

 .EXAMPLE
  ./azure_setup_federated.ps1 -SubscriptionId 00000000-0000-0000-0000-000000000000 -ResourceGroup rg-demo -Location southeastasia -AppName obsidian-backend -GitHubOrg billlzzz10 -GitHubRepo obsidian-plugin -GitHubBranch main

 After run, copy file azure_credentials.json content into GitHub repo secret: AZURE_CREDENTIALS_JSON

.#>
param(
    [Parameter(Mandatory=$true)][string]$SubscriptionId,
    [Parameter(Mandatory=$true)][string]$ResourceGroup,
    [Parameter(Mandatory=$true)][string]$Location,
    [Parameter(Mandatory=$true)][string]$AppName,
    [Parameter(Mandatory=$true)][string]$GitHubOrg,
    [Parameter(Mandatory=$true)][string]$GitHubRepo,
    [string]$GitHubBranch = 'main',
    [string]$OutputJsonPath = './azure_credentials.json'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($msg){ Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host "[ERROR] $msg" -ForegroundColor Red }

Write-Info "Validating prerequisites"
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Err "Azure CLI (az) not found. Install: https://learn.microsoft.com/cli/azure/install-azure-cli"; exit 1
}

# Login if needed
try {
    $account = az account show --only-show-errors | ConvertFrom-Json
} catch {
    Write-Info "Not logged in. Launching interactive 'az login'..."
    az login --only-show-errors | Out-Null
    $account = az account show --only-show-errors | ConvertFrom-Json
}

if (-not $account) { Write-Err "Cannot obtain az account context."; exit 1 }
Write-Info "Current tenant: $($account.tenantId) User: $($account.user.name)"

if ($account.id -ne $SubscriptionId) {
    Write-Info "Selecting subscription $SubscriptionId"
    az account set --subscription $SubscriptionId --only-show-errors
    $account = az account show --only-show-errors | ConvertFrom-Json
}

if ($account.id -ne $SubscriptionId) { Write-Err "Subscription switch failed"; exit 1 }

# 1. Resource Group
Write-Info "Ensuring Resource Group '$ResourceGroup' in $Location"
$rg = az group show -n $ResourceGroup --only-show-errors 2>$null | ConvertFrom-Json
if (-not $rg) {
    az group create -n $ResourceGroup -l $Location --only-show-errors | Out-Null
    Write-Info "Created RG $ResourceGroup"
} else { Write-Info "RG exists" }

# 2. App Registration
Write-Info "Ensuring App Registration '$AppName'"
$app = az ad app list --display-name $AppName --only-show-errors | ConvertFrom-Json | Select-Object -First 1
if (-not $app) {
    $app = az ad app create --display-name $AppName --only-show-errors | ConvertFrom-Json
    Write-Info "Created App Registration: $($app.appId)"
} else { Write-Info "App already exists: $($app.appId)" }

# 3. Service Principal (may auto-create on role assignment)
Write-Info "Ensuring Service Principal for app"
$sp = az ad sp list --filter "appId eq '$($app.appId)'" --only-show-errors | ConvertFrom-Json | Select-Object -First 1
if (-not $sp) {
    $sp = az ad sp create --id $app.appId --only-show-errors | ConvertFrom-Json
    Write-Info "Created SP: $($sp.id)"
} else { Write-Info "SP exists: $($sp.id)" }

# 4. Role Assignment (Contributor)
Write-Info "Ensuring Contributor role assignment on RG"
$scope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup"
$roleCheck = az role assignment list --assignee $app.appId --scope $scope --only-show-errors | ConvertFrom-Json
if (-not ($roleCheck | Where-Object { $_.roleDefinitionName -eq 'Contributor' })) {
    az role assignment create --assignee $app.appId --role Contributor --scope $scope --only-show-errors | Out-Null
    Write-Info "Role assignment created"
} else { Write-Info "Role already assigned" }

# 5. Federated Credential
$fidName = "github-$GitHubBranch"
Write-Info "Ensuring Federated Credential '$fidName'"
$existingCreds = az ad app federated-credential list --id $app.appId --only-show-errors | ConvertFrom-Json
$subject = "repo:$GitHubOrg/$GitHubRepo:ref:refs/heads/$GitHubBranch"
if (-not ($existingCreds | Where-Object { $_.name -eq $fidName })) {
    $tmpJson = [IO.Path]::GetTempFileName()
    @{
        name = $fidName
        issuer = 'https://token.actions.githubusercontent.com'
        subject = $subject
        audiences = @('api://AzureADTokenExchange')
    } | ConvertTo-Json -Depth 4 | Set-Content -Path $tmpJson -Encoding UTF8
    az ad app federated-credential create --id $app.appId --parameters @$tmpJson --only-show-errors | Out-Null
    Remove-Item $tmpJson -Force
    Write-Info "Federated credential created (subject: $subject)"
} else { Write-Info "Federated credential already exists" }

# 6. Output JSON
Write-Info "Writing credentials JSON to $OutputJsonPath"
$outObj = [ordered]@{
    clientId       = $app.appId
    tenantId       = $account.tenantId
    subscriptionId = $SubscriptionId
}
$json = $outObj | ConvertTo-Json -Depth 3
$json | Set-Content -Path $OutputJsonPath -Encoding UTF8
Write-Host "---- AZURE_CREDENTIALS_JSON (copy into GitHub Secret) ----" -ForegroundColor Green
Write-Host $json
Write-Host "---------------------------------------------------------" -ForegroundColor Green
Write-Info "Done. Add the above JSON as GitHub secret: AZURE_CREDENTIALS_JSON"
Write-Info "Workflow federated credential subject used: $subject"

Write-Info "Next: Push code -> GitHub Action uses OIDC to login (no client secret needed)."
