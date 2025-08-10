# Complete Azure Deployment Guide for Obsidian AI Backend

## สิ่งที่ต้องเตรียมก่อนการ Deploy

### 1. ข้อกำหนดพื้นฐาน
- Azure subscription ที่มี permissions สำหรับสร้าง resource groups, app services, และ storage accounts
- GitHub account พร้อม repository permissions
- Azure CLI ติดตั้งบนเครื่องท้องถิ่น
- Git CLI ติดตั้งแล้ว

### 2. ขั้นตอนการตั้งค่าแบบอัตโนมัติ (แนะนำ)

```bash
# เข้าไปในโฟลเดอร์ backend
cd obsidian-n-a/backend

# รันสคริปต์ตั้งค่าอัตโนมัติ
./scripts/setup-azure.sh
```

สคริปต์นี้จะทำการ:
- ตรวจสอบ prerequisites
- เข้าสู่ระบบ Azure
- สร้าง Resource Group และ Azure resources ผ่าน Bicep
- ตั้งค่า GitHub OIDC authentication
- กำหนดค่า GitHub repository variables
- สร้างไฟล์สรุปการติดตั้ง

### 3. ขั้นตอนการตั้งค่าแบบ Manual

#### 3.1 สร้าง Azure Resources

```bash
# Login to Azure
az login

# สร้าง Resource Group
az group create --name ObsidianBackendRG --location eastus

# Deploy infrastructure ด้วย Bicep
az deployment group create \
  --resource-group ObsidianBackendRG \
  --template-file deploy.bicep \
  --parameters appName=obsidian-backend location=eastus sku=B1 pythonVersion=3.11 sqlAdminPassword="YourSecurePassword123!"
```

#### 3.2 ตั้งค่า GitHub OIDC Authentication

1. สร้าง Azure AD Application:
```bash
APP_ID=$(az ad app create --display-name "obsidian-backend-github" --query appId -o tsv)
az ad sp create --id $APP_ID
```

2. สร้าง Federated Credentials สำหรับ GitHub Actions:
```bash
cat > federated-credential.json << EOF
{
    "name": "obsidian-backend-github-actions",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:YOUR_GITHUB_USERNAME/YOUR_REPO_NAME:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
}
EOF

az ad app federated-credential create --id $APP_ID --parameters federated-credential.json
```

3. กำหนด Permissions:
```bash
az role assignment create \
  --assignee $APP_ID \
  --role "Contributor" \
  --scope "/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/ObsidianBackendRG"
```

#### 3.3 ตั้งค่า GitHub Repository Variables

ใน GitHub repository ให้ไปที่ Settings > Secrets and variables > Actions และเพิ่ม Variables ต่อไปนี้:

```
AZURE_CLIENT_ID: [APP_ID จากขั้นตอนที่แล้ว]
AZURE_TENANT_ID: [Tenant ID ของ Azure subscription]
AZURE_SUBSCRIPTION_ID: [Subscription ID ของ Azure]
AZURE_RG: ObsidianBackendRG
AZURE_LOCATION: eastus
AZURE_APP_NAME: obsidian-backend
```

## การใช้งาน GitHub Actions Workflow

### 1. Automatic Deployment
เมื่อมีการ push โค้ดไปยัง `main` branch หรือมีการเปลี่ยนแปลงในโฟลเดอร์ `obsidian-n-a/backend/` GitHub Actions จะทำการ deploy อัตโนมัติ

### 2. Manual Deployment
สามารถรัน workflow ด้วยตัวเองได้ที่ GitHub Actions tab และคลิก "Run workflow"

### 3. Monitoring Deployment
- ดู deployment status ใน GitHub Actions tab
- ตรวจสอบ logs ของ Azure App Service:
```bash
az webapp log tail --name obsidian-backend --resource-group ObsidianBackendRG
```

## การกำหนดค่า Plugin

หลังจาก deploy สำเร็จแล้ว ให้อัปเดตการตั้งค่าใน Obsidian plugin:

1. เปิด Obsidian และไปที่ plugin settings
2. อัปเดต Backend URL เป็น: `https://obsidian-backend.azurewebsites.net`
3. กำหนด API Key ตามที่ต้องการ
4. ทดสอบการเชื่อมต่อ

## การทดสอบ API

```bash
# Health check
curl https://obsidian-backend.azurewebsites.net/health

# API documentation
# เปิดเว็บเบราว์เซอร์ไปที่: https://obsidian-backend.azurewebsites.net/docs

# ทดสอบ API endpoint (ต้องใช้ API key)
curl -X POST https://obsidian-backend.azurewebsites.net/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"query": "Hello, how are you?", "history": []}'
```

## การแก้ไขปัญหา

### 1. ปัญหา GitHub Actions
- ตรวจสอบว่า Repository Variables ทั้งหมดถูกตั้งค่าถูกต้อง
- ตรวจสอบ OIDC configuration ใน Azure AD
- ดู detailed logs ใน GitHub Actions

### 2. ปัญหา App Service
- ตรวจสอบ Application Settings:
```bash
az webapp config appsettings list --name obsidian-backend --resource-group ObsidianBackendRG
```

- ดู Application Logs:
```bash
az webapp log download --name obsidian-backend --resource-group ObsidianBackendRG
```

- Restart App Service:
```bash
az webapp restart --name obsidian-backend --resource-group ObsidianBackendRG
```

### 3. ปัญหา Database Connection
- ตรวจสอบ SQL Server firewall rules
- ตรวจสอบ connection string ใน app settings
- ทดสอบการเชื่อมต่อจาก local machine

### 4. ปัญหา Plugin Connection
- ตรวจสอบ CORS settings
- ตรวจสอบ API key configuration
- ตรวจสอบ network connectivity

## Security Best Practices

1. **API Keys**: ใช้ strong API keys และเปลี่ยนเป็นประจำ
2. **Database**: ใช้ complex passwords และ enable encryption
3. **HTTPS**: บังคับใช้ HTTPS สำหรับการเชื่อมต่อทั้งหมด
4. **Access Control**: ใช้ Azure AD authentication ที่เหมาะสม
5. **Monitoring**: ตั้งค่า Application Insights สำหรับ monitoring และ alerting

## Resources และ Costs

### ราคาโดยประมาณ (per month):
- App Service Plan (B1): ~$13 USD
- SQL Database (Basic): ~$5 USD  
- Storage Account: ~$1-2 USD
- Application Insights: ~$2-5 USD

**รวมประมาณ $21-25 USD ต่อเดือน**

### การประหยัดค่าใช้จ่าย:
- ใช้ Free tier สำหรับ development/testing
- ตั้งค่า auto-scaling เพื่อประหยัดพลังงาน
- ใช้ Azure Reserved Instances สำหรับ production ระยะยาว

## การ Backup และ Recovery

1. **Database Backup**: Azure SQL มี automatic backup
2. **Application Code**: เก็บใน Git repository
3. **Configuration**: backup app settings และ environment variables
4. **Storage**: ตั้งค่า geo-redundant storage สำหรับ vector store

## Next Steps

1. ตั้งค่า custom domain name
2. ใช้ Azure CDN สำหรับ performance
3. ตั้งค่า staging environment สำหรับ testing
4. Implement CI/CD pipeline สำหรับ multiple environments
5. ตั้งค่า monitoring และ alerting