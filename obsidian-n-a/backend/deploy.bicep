// Comprehensive Bicep template for Obsidian AI Backend Azure deployment
param location string = resourceGroup().location
param appName string
param sku string = 'B1'
param pythonVersion string = '3.11'
param sqlAdminLogin string = 'obsidian-admin'
@secure()
param sqlAdminPassword string = ''

// Variables
var storageAccountName = '${replace(appName, '-', '')}storage'
var logAnalyticsName = '${appName}-logs'
var appInsightsName = '${appName}-insights'
var sqlServerName = '${appName}-sqlserver'
var sqlDatabaseName = '${appName}-db'

// Storage Account for vector store and file storage
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// SQL Server (optional - only if password is provided)
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = if (!empty(sqlAdminPassword)) {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// SQL Database
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = if (!empty(sqlAdminPassword)) {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
    capacity: 5
  }
  properties: {
    maxSizeBytes: 2147483648 // 2GB
  }
}

// Firewall rule to allow Azure services
resource sqlFirewallRule 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = if (!empty(sqlAdminPassword)) {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// App Service Plan
resource plan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: sku
    tier: sku == 'F1' ? 'Free' : 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// App Service
resource app 'Microsoft.Web/sites@2023-01-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: 'PYTHON|${pythonVersion}'
      alwaysOn: sku != 'F1' // AlwaysOn not available in Free tier
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [
        {
          name: 'ENVIRONMENT'
          value: 'production'
        }
        {
          name: 'PYTHONPATH'
          value: '/home/site/wwwroot/src'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'PYTHON_ENABLE_GUNICORN'
          value: '1'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'DATABASE_URL'
          value: !empty(sqlAdminPassword) ? 'mssql+pyodbc://${sqlAdminLogin}:${sqlAdminPassword}@${sqlServer.properties.fullyQualifiedDomainName}:1433/${sqlDatabaseName}?driver=ODBC+Driver+18+for+SQL+Server&encrypt=yes&trustservercertificate=no&connection+timeout=30' : 'sqlite:///tmp/sqlite.db'
        }
        {
          name: 'VECTOR_STORE_PATH'
          value: '/tmp/vector_store'
        }
      ]
    }
    httpsOnly: true
  }
}

// Grant Storage Blob Data Contributor role to the App Service
resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, app.id, 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor
    principalId: app.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Outputs
output appServiceUrl string = app.properties.defaultHostName
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output storageAccountName string = storageAccount.name
output sqlServerName string = !empty(sqlAdminPassword) ? sqlServer.name : ''
output sqlDatabaseName string = !empty(sqlAdminPassword) ? sqlDatabaseName : ''
