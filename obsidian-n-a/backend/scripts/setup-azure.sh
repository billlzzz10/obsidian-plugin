#!/bin/bash
# Azure Setup Script for Obsidian AI Backend
set -euo pipefail

# Configuration
RESOURCE_GROUP="ObsidianBackendRG"
LOCATION="eastus"
APP_NAME="obsidian-backend"
SQL_ADMIN_LOGIN="obsidian-admin"
SUBSCRIPTION_ID=""
TENANT_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        log_info "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI is not installed. Manual secret setup will be required."
    fi
    
    log_success "Prerequisites check completed"
}

# Login to Azure
azure_login() {
    log_info "Logging into Azure..."
    
    if ! az account show &>/dev/null; then
        az login
    fi
    
    # Get subscription and tenant IDs
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    TENANT_ID=$(az account show --query tenantId -o tsv)
    
    log_success "Logged into Azure"
    log_info "Subscription ID: $SUBSCRIPTION_ID"
    log_info "Tenant ID: $TENANT_ID"
}

# Create Azure resources
create_azure_resources() {
    log_info "Creating Azure resources..."
    
    # Create resource group
    log_info "Creating resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    
    # Generate a secure password for SQL Server
    SQL_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    log_info "Deploying infrastructure with Bicep..."
    az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "../deploy.bicep" \
        --parameters appName="$APP_NAME" location="$LOCATION" sku=B1 pythonVersion=3.11 sqlAdminLogin="$SQL_ADMIN_LOGIN" sqlAdminPassword="$SQL_PASSWORD"
    
    # Get deployment outputs
    APP_URL=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "deploy" --query properties.outputs.appServiceUrl.value -o tsv)
    STORAGE_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "deploy" --query properties.outputs.storageAccountName.value -o tsv)
    
    log_success "Azure resources created successfully"
    log_info "App Service URL: https://$APP_URL"
    log_info "Storage Account: $STORAGE_NAME"
    
    # Save credentials securely
    echo "SQL_ADMIN_PASSWORD=$SQL_PASSWORD" > .azure-secrets
    echo "APP_URL=$APP_URL" >> .azure-secrets
    echo "STORAGE_NAME=$STORAGE_NAME" >> .azure-secrets
    chmod 600 .azure-secrets
    
    log_warning "SQL admin password saved to .azure-secrets file. Keep this secure!"
}

# Setup OIDC for GitHub Actions
setup_github_oidc() {
    log_info "Setting up GitHub OIDC authentication..."
    
    # Create Azure AD application
    APP_ID=$(az ad app create --display-name "obsidian-backend-github" --query appId -o tsv)
    
    # Create service principal
    az ad sp create --id "$APP_ID"
    
    # Create federated credentials for GitHub Actions
    cat > federated-credential.json << EOF
{
    "name": "obsidian-backend-github-actions",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/'):ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
}
EOF
    
    az ad app federated-credential create --id "$APP_ID" --parameters federated-credential.json
    rm federated-credential.json
    
    # Assign Contributor role to the resource group
    az role assignment create \
        --assignee "$APP_ID" \
        --role "Contributor" \
        --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
    
    log_success "GitHub OIDC setup completed"
    log_info "Client ID: $APP_ID"
    log_info "Tenant ID: $TENANT_ID"
    log_info "Subscription ID: $SUBSCRIPTION_ID"
    
    # Setup GitHub secrets if GitHub CLI is available
    if command -v gh &> /dev/null; then
        log_info "Setting up GitHub repository variables..."
        gh variable set AZURE_CLIENT_ID --body "$APP_ID"
        gh variable set AZURE_TENANT_ID --body "$TENANT_ID"
        gh variable set AZURE_SUBSCRIPTION_ID --body "$SUBSCRIPTION_ID"
        gh variable set AZURE_RG --body "$RESOURCE_GROUP"
        gh variable set AZURE_LOCATION --body "$LOCATION"
        gh variable set AZURE_APP_NAME --body "$APP_NAME"
        log_success "GitHub variables configured"
    else
        log_warning "GitHub CLI not available. Please manually set these repository variables:"
        echo "AZURE_CLIENT_ID: $APP_ID"
        echo "AZURE_TENANT_ID: $TENANT_ID"
        echo "AZURE_SUBSCRIPTION_ID: $SUBSCRIPTION_ID"
        echo "AZURE_RG: $RESOURCE_GROUP"
        echo "AZURE_LOCATION: $LOCATION"
        echo "AZURE_APP_NAME: $APP_NAME"
    fi
}

# Generate deployment summary
generate_summary() {
    log_info "Generating deployment summary..."
    
    cat > "AZURE_DEPLOYMENT_SETUP.md" << EOF
# Azure Deployment Setup Complete

## Resources Created
- **Resource Group**: $RESOURCE_GROUP
- **App Service**: $APP_NAME
- **Location**: $LOCATION
- **App URL**: https://$(az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query defaultHostName -o tsv)

## GitHub Actions Configuration
The following repository variables have been configured:
- AZURE_CLIENT_ID: $APP_ID
- AZURE_TENANT_ID: $TENANT_ID  
- AZURE_SUBSCRIPTION_ID: $SUBSCRIPTION_ID
- AZURE_RG: $RESOURCE_GROUP
- AZURE_LOCATION: $LOCATION
- AZURE_APP_NAME: $APP_NAME

## Next Steps
1. Push code to main branch to trigger deployment
2. Monitor deployment in GitHub Actions
3. Configure plugin settings with the App URL
4. Test the API endpoints

## Useful Commands
\`\`\`bash
# Check app logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Restart the app
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# Update app settings
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings KEY=VALUE
\`\`\`

## Security Notes
- SQL admin credentials are stored in .azure-secrets file
- Application uses system-assigned managed identity
- HTTPS is enforced for all connections
EOF
    
    log_success "Deployment summary saved to AZURE_DEPLOYMENT_SETUP.md"
}

# Main execution
main() {
    log_info "Starting Azure setup for Obsidian AI Backend..."
    
    check_prerequisites
    azure_login
    create_azure_resources
    setup_github_oidc
    generate_summary
    
    log_success "Azure setup completed successfully!"
    log_info "Check AZURE_DEPLOYMENT_SETUP.md for next steps"
}

# Run main function
main "$@"