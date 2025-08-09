// Bicep template for deploying FastAPI backend to Azure App Service
param location string = resourceGroup().location
param appName string
param sku string = 'B1'
param pythonVersion string = '3.11'

resource plan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: sku
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource app 'Microsoft.Web/sites@2022-03-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: 'PYTHON|${pythonVersion}'
      appSettings: [
        {
          name: 'ENVIRONMENT'
          value: 'production'
        }
        // Add more app settings as needed
      ]
    }
    httpsOnly: true
  }
}

output appServiceUrl string = app.defaultHostName
