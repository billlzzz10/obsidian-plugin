# PowerShell script to deploy FastAPI backend to Azure App Service
# Usage: .\deploy.ps1 <resource-group> <app-name> <location>

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$true)]
    [string]$AppName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location
)

# Create resource group
Write-Host "Creating resource group $ResourceGroup in $Location..."
az group create --name $ResourceGroup --location $Location

# Deploy Bicep template
Write-Host "Deploying Azure resources using Bicep template..."
az deployment group create `
  --resource-group $ResourceGroup `
  --template-file deploy.bicep `
  --parameters appName=$AppName

# Zip deploy code (assumes Dockerfile present)
Write-Host "Preparing application package..."
Compress-Archive -Path * -DestinationPath app.zip -Force -Exclude "*.git*", "*__pycache__*", "*.ipynb_checkpoints*"

# Deploy code to App Service
Write-Host "Deploying application to App Service..."
az webapp deploy --resource-group $ResourceGroup --name $AppName --src-path app.zip

# Clean up
Remove-Item app.zip -Force

Write-Host "Deployment complete!"
