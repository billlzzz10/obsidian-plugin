# วิธีการ Deploy Backend ไปยัง Azure Portal (ไม่ใช้ CLI)

เนื่องจากคุณไม่มี Azure CLI แต่คุณได้ลอคอินเข้า Azure แล้ว คุณสามารถ deploy backend ผ่าน Azure Portal ได้ตามขั้นตอนต่อไปนี้:

## 1. เตรียมไฟล์ ZIP สำหรับการ Deploy

```powershell
# สร้างไฟล์ ZIP ของ backend
Compress-Archive -Path "Z:\000_DOC\00_WRI\Vault\Vault\.obsidian\plugins\obsidian-plugin\obsidian-n-a\backend\*" -DestinationPath "Z:\000_DOC\00_WRI\Vault\Vault\.obsidian\plugins\obsidian-plugin\obsidian-n-a\backend\app.zip" -Force
```

## 2. สร้าง Resource Group บน Azure Portal

1. เข้าสู่ [Azure Portal](https://portal.azure.com)
2. ค้นหาและเลือก "Resource groups"
3. คลิก "+ Create" เพื่อสร้าง Resource Group ใหม่
4. กรอกข้อมูลต่อไปนี้:
   - Subscription: เลือก subscription ของคุณ
   - Resource group: `ObsidianBackendRG`
   - Region: `East US` (หรือภูมิภาคที่ต้องการ)
5. คลิก "Review + create" และ "Create"

## 3. สร้าง App Service Plan

1. ใน Resource Group ที่สร้างไว้ คลิก "+ Create"
2. ค้นหา "App Service Plan" และเลือก
3. กรอกข้อมูลต่อไปนี้:
   - Name: `obsidian-backend-plan`
   - Operating System: `Linux`
   - Region: `East US` (หรือภูมิภาคเดิม)
   - Pricing Plan: เลือก `B1` (Basic) หรือสูงกว่า
4. คลิก "Review + create" และ "Create"

## 4. สร้าง Web App

1. ใน Resource Group เดียวกัน คลิก "+ Create"
2. ค้นหา "Web App" และเลือก
3. กรอกข้อมูลต่อไปนี้:
   - Name: `obsidian-backend` (หรือชื่อที่ต้องการ)
   - Publish: `Code`
   - Runtime stack: `Python 3.11`
   - Operating System: `Linux`
   - Region: `East US` (หรือภูมิภาคเดิม)
   - App Service Plan: เลือก plan ที่สร้างไว้ (`obsidian-backend-plan`)
4. คลิก "Next: Deployment" และเลือก "Enable GitHub Actions" หรือ "Enable continuous deployment" หากต้องการ
5. คลิก "Review + create" และ "Create"

## 5. อัปโหลด Dockerfile และตั้งค่า Container

1. เมื่อสร้าง Web App เสร็จ ให้เข้าไปที่ Web App
2. ไปที่ "Deployment Center"
3. เลือก "Container" และ "Docker Hub" หรือ "Private Registry"
4. กรอกข้อมูลต่อไปนี้:
   - Registry source: `Local Dockerfile`
   - Dockerfile path: `/Dockerfile`
   - Startup command: ปล่อยว่างไว้
5. คลิก "Save"

## 6. ตั้งค่า Application Settings

1. ไปที่ "Configuration" ของ Web App
2. ในแท็บ "Application settings" คลิก "+ New application setting"
3. เพิ่มการตั้งค่าต่อไปนี้ (ตามที่มีใน .env.production):
   - `HOST`: `0.0.0.0`
   - `PORT`: `8000`
   - `DEBUG`: `False`
   - `ENVIRONMENT`: `production`
   - `SECRET_KEY`: (คีย์ความปลอดภัยของคุณ)
   - `CORS_ORIGINS`: `["app://obsidian.md", "capacitor://localhost", "http://localhost"]`
   - `DATABASE_URL`: (connection string ของ SQL Database)
   - `DEFAULT_EMBEDDING_MODEL`: `all-MiniLM-L6-v2`
   - `DEFAULT_LLM_PROVIDER`: `azure`
   - `MAX_CONTEXT_LENGTH`: `100000`
   - `EMBEDDING_CACHE_TTL`: `3600`
   - `VECTOR_STORE_PATH`: `/app/data/vector_store`
4. คลิก "Save"

## 7. เริ่มต้น Deployment

1. ไปที่ "Overview" ของ Web App
2. คลิก "Restart" เพื่อเริ่มต้นการ build และ deploy

## 8. ตรวจสอบ Logs

1. ไปที่ "Log stream" เพื่อดู logs แบบ real-time
2. หรือไปที่ "Deployment Center" > "Logs" เพื่อดู logs การ build

## 9. ตรวจสอบการทำงาน

1. หลังจาก deploy สำเร็จ ให้เข้าไปที่ URL ของ Web App: `https://obsidian-backend.azurewebsites.net`
2. ตรวจสอบว่า API ทำงานได้โดยเข้าไปที่ `/docs` เพื่อดู Swagger documentation

## 10. อัปเดตการตั้งค่าใน Obsidian Plugin

1. ในการตั้งค่าของ plugin ให้อัปเดต Backend URL เป็น URL ของ Web App: `https://obsidian-backend.azurewebsites.net`
2. ตรวจสอบว่ามีการตั้งค่า API Key และการตั้งค่าอื่นๆ ที่จำเป็น
