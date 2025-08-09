# ObsidianMind Pro Backend

Backend API สำหรับ ObsidianMind Pro plugin ที่ใช้งานร่วมกับ Azure

## โครงสร้างโปรเจค

```
backend/
├── config/              # ไฟล์การตั้งค่าต่างๆ
├── src/                 # ซอร์สโค้ดหลัก
│   ├── api/             # API routes
│   ├── core/            # ฟังก์ชันหลัก
│   ├── db/              # การเชื่อมต่อฐานข้อมูล
│   ├── models/          # โมเดลข้อมูล
│   ├── services/        # บริการต่างๆ
│   └── main.py          # จุดเริ่มต้นแอปพลิเคชัน
├── tests/               # ไฟล์ทดสอบ
├── .env.example         # ตัวอย่างไฟล์ environment variables
├── .env.production      # ไฟล์ environment variables สำหรับ production
├── Dockerfile           # สำหรับสร้าง Docker image
├── requirements.txt     # Python dependencies หลัก
└── requirements/        # Python dependencies แยกตามประเภท
```

## การ Deploy ไปยัง Azure

### วิธีที่ 1: ใช้ GitHub Actions (แนะนำ)

เราใช้ GitHub Actions เพื่อทำ CI/CD pipeline อัตโนมัติ ทุกครั้งที่มีการ push โค้ดไปยัง branch `main` หรือเมื่อมีการสั่ง run workflow ด้วยตัวเอง

#### สิ่งที่ต้องตั้งค่า:
1. Azure Container Registry
2. Azure Web App for Containers
3. GitHub Secrets (AZURE_CREDENTIALS, REGISTRY_LOGIN_SERVER, REGISTRY_USERNAME, REGISTRY_PASSWORD)

ดูรายละเอียดเพิ่มเติมได้ที่ [วิธีการตั้งค่า GitHub Actions](../GITHUB_ACTIONS_DEPLOY_TH.md)

### วิธีที่ 2: ใช้ Azure CLI หรือ Azure Portal

#### ใช้ Azure CLI:

```bash
# Login to Azure
az login

# เข้าสู่ Azure Container Registry
az acr login --name <your-registry-name>

# Build และ Push Docker image
docker build -t <your-registry-name>.azurecr.io/obsidian-backend:latest ./backend
docker push <your-registry-name>.azurecr.io/obsidian-backend:latest

# สร้าง App Service Plan (ถ้ายังไม่มี)
az appservice plan create --name ObsidianAppServicePlan --resource-group ObsidianBackendRG --is-linux --sku B1

# สร้าง Web App
az webapp create --resource-group ObsidianBackendRG --plan ObsidianAppServicePlan --name obsidian-backend --deployment-container-image-name <your-registry-name>.azurecr.io/obsidian-backend:latest

# ตั้งค่า App Settings จากไฟล์ .env.production
while IFS= read -r line || [ -n "$line" ]; do
  # ข้ามบรรทัดที่เป็นความคิดเห็นหรือว่างเปล่า
  [[ $line = \#* || -z $line ]] && continue
  # แยกตัวแปรและค่า
  key=$(echo $line | cut -d= -f1)
  value=$(echo $line | cut -d= -f2-)
  # เพิ่มการตั้งค่าในแอป
  az webapp config appsettings set --name obsidian-backend --resource-group ObsidianBackendRG --settings "$key=$value"
done < .env.production
```

#### ใช้ Azure Portal:

1. สร้าง Container Registry ใน Azure
2. Build และ Push Docker image ไปยัง Container Registry
3. สร้าง Web App for Containers และเลือก image ที่ push ไป
4. ตั้งค่า Application Settings ตามไฟล์ .env.production

## การทดสอบ API หลังจาก Deploy

```bash
# ทดสอบว่า API ทำงานปกติ
curl https://obsidian-backend.azurewebsites.net/health

# ทดสอบการรับและส่งข้อมูล (ต้องใช้ API key)
curl -X POST https://obsidian-backend.azurewebsites.net/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"query": "Hello, how are you?", "history": []}'
```

## การเชื่อมต่อจาก Plugin

ในการตั้งค่าของ Plugin ให้อัปเดต Backend URL เป็น:
```
https://obsidian-backend.azurewebsites.net
```

และกำหนด API Key ให้ตรงกับที่ตั้งไว้ใน `.env.production`
