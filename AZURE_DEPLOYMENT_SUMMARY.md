# สรุปการอัปเดตและการตั้งค่า Azure Deployment

## สิ่งที่เราได้ทำเสร็จแล้ว

1. **อัปเดตเอกสาร GitHub Actions**
   - อัปเดต `GITHUB_ACTIONS_DEPLOY_TH.md` เพื่ออธิบายวิธีการตั้งค่า GitHub Actions สำหรับ deployment
   - เพิ่มวิธีการสร้างและกำหนดค่า Azure Container Registry
   - อัปเดตขั้นตอนการตั้งค่า GitHub Secrets สำหรับ Azure credentials และ container registry

2. **จัดเตรียมเอกสารสำหรับ Backend**
   - สร้าง `README.md` ในโฟลเดอร์ backend
   - อธิบายโครงสร้างโปรเจค, วิธีการ deploy และการทดสอบ API

3. **เพิ่มไฟล์ตัวอย่างสำหรับการตั้งค่า**
   - สร้าง `.env.example` สำหรับ backend
   - อธิบายค่าต่างๆ ที่ต้องกำหนดสำหรับการพัฒนาและการใช้งานจริง

4. **จัดเตรียมเครื่องมือแปลภาษา**
   - อัปเดต `README_TRANSLATION_TOOLS.md` เพื่ออธิบายเครื่องมือแปลภาษา
   - ปรับปรุง `run_enhanced_translation.bat` สำหรับรันการแปลภาษาบน Windows
   - สร้าง `setup_and_run_translation.py` สำหรับการติดตั้งและรันการแปลภาษาอัตโนมัติ

## ขั้นตอนต่อไป

### 1. สำหรับการ Deploy Backend ไปยัง Azure

1. **สร้าง Azure Container Registry**
   - ใช้ Azure Portal หรือ Azure CLI
   - เปิดใช้งาน Admin user และบันทึก credentials

2. **ตั้งค่า GitHub Secrets**
   - เพิ่ม `AZURE_CREDENTIALS`, `REGISTRY_LOGIN_SERVER`, `REGISTRY_USERNAME` และ `REGISTRY_PASSWORD`
   - ทำตามขั้นตอนในเอกสาร `GITHUB_ACTIONS_DEPLOY_TH.md`

3. **สร้าง Azure Web App for Containers**
   - ตั้งค่า Web App ให้ใช้ Container จาก Azure Container Registry
   - กำหนดค่า App Settings ตาม `.env.production`

4. **ทดสอบ Workflow**
   - ทำการ push ไปยัง GitHub repository เพื่อเริ่ม workflow
   - ตรวจสอบสถานะการ deploy ใน GitHub Actions
   - ทดสอบ API ด้วย curl หรือ Postman

### 2. สำหรับเครื่องมือแปลภาษา

1. **ตั้งค่า API Keys**
   - ขอ API key จาก Azure Translator Service หรือ OpenAI
   - สร้างไฟล์ `.env` ในโฟลเดอร์ `obsidian-n-a`
   - กำหนดค่าตาม `.env.example`

2. **ทดสอบการแปล**
   - รัน `run_enhanced_translation.bat` บน Windows หรือ `setup_and_run_translation.py` บน cross-platform
   - ทดสอบการแปลไฟล์ตัวอย่าง

### 3. การบูรณาการกับ Plugin

1. **อัปเดต Backend URL ใน Plugin Settings**
   - เปิดการตั้งค่าของ plugin ใน Obsidian
   - อัปเดต Backend URL เป็น URL ของ Azure Web App (เช่น `https://obsidian-backend.azurewebsites.net`)
   - กำหนด API Key ให้ตรงกับที่ตั้งไว้ใน `.env.production`

2. **ทดสอบการเชื่อมต่อ**
   - ทดสอบฟีเจอร์ AI ต่างๆ ใน Plugin
   - ตรวจสอบ logs ใน Azure Portal เพื่อแก้ไขปัญหาหากมี

## การแก้ไขปัญหา

1. **ปัญหาเกี่ยวกับ GitHub Actions**
   - ตรวจสอบ Secret ทั้งหมดว่าถูกตั้งค่าอย่างถูกต้อง
   - ตรวจสอบ logs ใน GitHub Actions
   - ตรวจสอบสิทธิ์การเข้าถึงของ Service Principal

2. **ปัญหาเกี่ยวกับ Docker**
   - ตรวจสอบ Dockerfile และ build process
   - ลอง build และ run image บนเครื่องคอมพิวเตอร์ท้องถิ่นก่อน

3. **ปัญหาเกี่ยวกับ API**
   - ตรวจสอบ App Settings ใน Azure Portal
   - ตรวจสอบ logs ของ App Service
   - ทดสอบ API ด้วย curl หรือ Postman
