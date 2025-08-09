# วิธีการตั้งค่า GitHub Actions สำหรับ Deploy ไปยัง Azure

## 1. สร้าง Azure Service Principal

เพื่อให้ GitHub Actions สามารถเข้าถึง Azure ได้ คุณต้องสร้าง Service Principal ซึ่งเป็นบัญชีที่ใช้สำหรับการเข้าถึง Azure โดยอัตโนมัติ

### วิธีการสร้าง Service Principal:

1. ลงชื่อเข้าใช้ [Azure Portal](https://portal.azure.com)
2. เปิด Cloud Shell (ไอคอนรูปเทอร์มินัลที่ด้านบนของหน้าจอ)
3. รันคำสั่งต่อไปนี้:

```bash
# สร้าง Service Principal
az ad sp create-for-rbac --name "obsidian-backend-deploy" --role contributor --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/ObsidianBackendRG --sdk-auth

# แทนที่ YOUR_SUBSCRIPTION_ID ด้วย ID ของ subscription ที่คุณใช้
```

4. คำสั่งนี้จะแสดงข้อมูล JSON ที่มีรูปแบบดังนี้:

```json
{
  "clientId": "xxx",
  "clientSecret": "xxx",
  "subscriptionId": "xxx",
  "tenantId": "xxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

5. คัดลอกข้อมูล JSON ทั้งหมดนี้ (รวมถึงวงเล็บปีกกา { })

## 2. สร้าง Azure Container Registry

1. ไปที่ [Azure Portal](https://portal.azure.com)
2. ค้นหาและเลือก "Container registries"
3. คลิก "+ Create" เพื่อสร้าง Container Registry ใหม่
4. กรอกข้อมูลต่อไปนี้:
   - Resource group: `ObsidianBackendRG`
   - Registry name: `obsidianacr` (หรือชื่ออื่นที่ไม่ซ้ำกับที่มีอยู่)
   - Location: `East US` (หรือภูมิภาคที่ต้องการ)
   - SKU: `Basic`
5. คลิก "Review + create" และ "Create"
6. หลังจากสร้างเสร็จ ให้ไปที่ Container Registry ที่สร้างขึ้น
7. ไปที่ "Access keys" และเปิดใช้งาน Admin user
8. จดบันทึกข้อมูลต่อไปนี้:
   - Login server (เช่น `obsidianacr.azurecr.io`)
   - Username
   - Password

## 3. เพิ่ม Secrets ใน GitHub Repository

### 3.1 เพิ่ม Secret สำหรับ Azure Credentials

1. เข้าไปที่ GitHub Repository ของคุณ: https://github.com/billlzzz10/obsidian-plugin
2. ไปที่ Settings > Secrets and variables > Actions
3. คลิก "New repository secret"
4. ตั้งชื่อ Secret เป็น `AZURE_CREDENTIALS`
5. วางข้อมูล JSON ที่คุณได้จากขั้นตอนที่ 1 ลงในช่อง Value
6. คลิก "Add secret"

### 3.2 เพิ่ม Secrets สำหรับ Azure Container Registry

7. คลิก "New repository secret" อีกครั้ง
8. ตั้งชื่อ Secret เป็น `REGISTRY_LOGIN_SERVER`
9. ใส่ค่า Login server ที่คุณได้จากขั้นตอนที่ 2 (เช่น `obsidianacr.azurecr.io`)
10. คลิก "Add secret"

11. คลิก "New repository secret" อีกครั้ง
12. ตั้งชื่อ Secret เป็น `REGISTRY_USERNAME`
13. ใส่ค่า Username ที่คุณได้จากขั้นตอนที่ 2
14. คลิก "Add secret"

15. คลิก "New repository secret" อีกครั้ง
16. ตั้งชื่อ Secret เป็น `REGISTRY_PASSWORD`
17. ใส่ค่า Password ที่คุณได้จากขั้นตอนที่ 2
18. คลิก "Add secret"

## 4. ตั้งค่า App Service เพื่อรองรับ Container

1. ไปที่ [Azure Portal](https://portal.azure.com)
2. สร้าง App Service ใหม่โดยใช้ขั้นตอนดังนี้:
   - ค้นหาและเลือก "App Services"
   - คลิก "+ Create"
   - กรอกข้อมูลต่อไปนี้:
     - Resource Group: `ObsidianBackendRG`
     - Name: `obsidian-backend`
     - Publish: `Docker Container`
     - Operating System: `Linux`
     - Region: `East US` (หรือภูมิภาคที่ต้องการ)
     - App Service Plan: สร้างใหม่หรือเลือกที่มีอยู่
   - ไปที่แท็บ "Docker"
   - เลือก "Single Container"
   - เลือก "Azure Container Registry"
   - เลือก Registry, Image, และ Tag ที่เหมาะสม (หรือเว้นว่างไว้ก่อน GitHub Actions จะอัปเดตให้ภายหลัง)
   - คลิก "Review + create" และ "Create"

## 5. Commit และ Push การเปลี่ยนแปลง

หลังจากเพิ่มไฟล์ workflow แล้ว ให้ commit และ push การเปลี่ยนแปลงไปยัง GitHub:

```bash
git add .github/workflows/deploy-backend.yml
git commit -m "Add GitHub Actions workflow for deploying backend to Azure"
git push origin main
```

## 6. ตรวจสอบการ Deploy

1. เข้าไปที่ GitHub Repository ของคุณ
2. ไปที่แท็บ "Actions"
3. คุณจะเห็น workflow "Deploy Backend to Azure" ทำงานโดยอัตโนมัติเมื่อมีการ push ไปยัง branch main
4. คุณยังสามารถรัน workflow ด้วยตัวเองโดยคลิกที่ "Run workflow" ได้อีกด้วย

## 7. เมื่อ Deploy เสร็จแล้ว

เมื่อ deploy เสร็จเรียบร้อยแล้ว URL ของ backend จะเป็น:
```
https://obsidian-backend.azurewebsites.net
```

ให้อัปเดต Backend URL ในการตั้งค่าของ plugin เป็น URL นี้
