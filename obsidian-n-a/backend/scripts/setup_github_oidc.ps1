param(
    [Parameter(Mandatory = $false)] [string] $Org = "billlzzz10",
    [Parameter(Mandatory = $false)] [string] $Repo = "obsidian-plugin",
    [Parameter(Mandatory = $false)] [string] $Branch = "main",

    [Parameter(Mandatory = $true)]  [string] $SubscriptionId,
    [Parameter(Mandatory = $false)] [string] $TenantId = "77e1f043-06d3-4328-b43e-cbcefd497b3d",

    [Parameter(Mandatory = $false)] [string] $AppName = "opsidian-ai-flowm",
    [Parameter(Mandatory = $false)] [string] $ResourceGroupName,
    [Parameter(Mandatory = $false)] [string] $Location = "southeastasia"
)

$ErrorActionPreference = "Stop"

if (-not $ResourceGroupName -or [string]::IsNullOrWhiteSpace($ResourceGroupName)) {
    $ResourceGroupName = "rg-$AppName"
}

Write-Host "Using parameters:" -ForegroundColor Cyan
Write-Host "  Org=$Org Repo=$Repo Branch=$Branch"
Write-Host "  TenantId=$TenantId SubscriptionId=$SubscriptionId"
Write-Host "  ResourceGroupName=$ResourceGroupName Location=$Location"
Write-Host "  AppName=$AppName"

# Check required CLIs
function Assert-Command($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Required CLI '$name' not found. Please install it and try again."
    }
}
Assert-Command az
Assert-Command gh

# Azure login and subscription selection
az login --tenant $TenantId | Out-Null
az account set --subscription $SubscriptionId

# Ensure resource group
Write-Host "Ensuring Resource Group..." -ForegroundColor Yellow
az group create -n $ResourceGroupName -l $Location | Out-Null

# Create App Registration
Write-Host "Creating App Registration (OIDC)..." -ForegroundColor Yellow
$AppJson = az ad app create --display-name "gh-oidc-$Repo" | Out-Null; `
$App = az ad app list --display-name "gh-oidc-$Repo" --query "[0]" | ConvertFrom-Json
if (-not $App) { throw "Failed to create/find App Registration" }
$AppId = $App.appId

# Create Service Principal
az ad sp create --id $AppId | Out-Null

# Assign role to RG
$Scope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName"
Write-Host "Assigning Contributor role on $Scope" -ForegroundColor Yellow
az role assignment create --assignee $AppId --role "Contributor" --scope $Scope | Out-Null

# Add Federated Credential for GitHub Actions OIDC
Write-Host "Adding Federated Credential for repo:$Org/$Repo (branch:$Branch)" -ForegroundColor Yellow
$fc = @{
  name        = "github-oidc-$Repo-$Branch"
  issuer      = "https://token.actions.githubusercontent.com"
  subject     = "repo:$Org/$Repo:ref:refs/heads/$Branch"
  description = "GitHub Actions OIDC for $Org/$Repo ($Branch)"
  audiences   = @("api://AzureADTokenExchange")
} | ConvertTo-Json
$fcFile = New-TemporaryFile
$fc | Set-Content -Path $fcFile -Encoding UTF8
az ad app federated-credential create --id $AppId --parameters @$fcFile
Remove-Item $fcFile -Force

# GitHub variables
Write-Host "Setting GitHub Repository Variables..." -ForegroundColor Yellow
# Ensure gh is authenticated to GitHub before running (gh auth login)
$repoFull = "$Org/$Repo"
gh repo set-default $repoFull | Out-Null

gh variable set AZURE_TENANT_ID --body $TenantId
gh variable set AZURE_SUBSCRIPTION_ID --body $SubscriptionId
gh variable set AZURE_CLIENT_ID --body $AppId

gh variable set AZURE_RG --body $ResourceGroupName
gh variable set AZURE_LOCATION --body $Location

gh variable set AZURE_APP_NAME --body $AppName

Write-Host "Done. GitHub Variables set for $repoFull" -ForegroundColor Green
Write-Host "You can now run the 'deploy-backend-azure' workflow in GitHub Actions." -ForegroundColor Green
