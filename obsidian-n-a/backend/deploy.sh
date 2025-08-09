#!/bin/bash
# Bash script to deploy FastAPI backend to Azure App Service
# Usage: ./deploy.sh <resource-group> <app-name> <location>
set -e

RESOURCE_GROUP=$1
APP_NAME=$2
LOCATION=$3

if [ -z "$RESOURCE_GROUP" ] || [ -z "$APP_NAME" ] || [ -z "$LOCATION" ]; then
  echo "Usage: $0 <resource-group> <app-name> <location>"
  exit 1
fi

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Deploy Bicep template
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file deploy.bicep \
  --parameters appName=$APP_NAME

# Zip deploy code (assumes Dockerfile present)
zip -r app.zip . -x "*.git*" "*__pycache__*" "*.ipynb_checkpoints*"

# Deploy code to App Service
az webapp deploy --resource-group $RESOURCE_GROUP --name $APP_NAME --src-path app.zip

# Clean up
rm app.zip

echo "Deployment complete!"
