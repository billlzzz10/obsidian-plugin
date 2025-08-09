# วิธีการ Deploy และการแก้ไขปัญหา

## 1. การแก้ไขไฟล์ SettingsTab.ts ที่มีปัญหา Syntax

ไฟล์ `SettingsTab.ts` มีปัญหา syntax หลายจุด เราได้สร้างไฟล์แก้ไขไว้ที่ `SettingsTab.ts.fixed`
ให้คุณทำการแทนที่ไฟล์เดิมด้วยไฟล์ที่แก้ไขแล้ว:

```powershell
Copy-Item -Path ".\src\ui\SettingsTab.ts.fixed" -Destination ".\src\ui\SettingsTab.ts" -Force
```

## 2. การบิลด์โปรเจ็คใหม่ด้วย esbuild

หลังจากแก้ไขไฟล์แล้ว ให้บิลด์โปรเจ็คด้วยคำสั่ง:

```powershell
npm run build
```

หรือใช้ Node.js เรียกใช้ไฟล์ esbuild.config.mjs โดยตรง:

```powershell
node esbuild.config.mjs production
```

## 3. การ Deploy Backend ไปยัง Azure (ไม่มี Azure CLI)

เนื่องจากคุณไม่มี Azure CLI ติดตั้งอยู่ แต่คุณลอคอินอยู่แล้ว คุณมีทางเลือก 2 ทาง:

### ทางเลือกที่ 1: ติดตั้ง Azure CLI

คุณสามารถติดตั้ง Azure CLI ด้วย PowerShell โดยใช้คำสั่ง:

```powershell
$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi; Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'; Remove-Item .\AzureCLI.msi
```

หลังจากติดตั้งเสร็จ รีสตาร์ท PowerShell แล้วใช้คำสั่ง:

```powershell
.\deploy.ps1 -ResourceGroup "ObsidianBackendRG" -AppName "obsidian-backend" -Location "eastus"
```

### ทางเลือกที่ 2: ใช้ Azure Portal

คุณสามารถ deploy ผ่าน Azure Portal โดยทำตามขั้นตอนต่อไปนี้:

1. เข้าสู่ [Azure Portal](https://portal.azure.com)
2. สร้าง Resource Group ใหม่
3. สร้าง App Service Plan (ระดับ Basic B1 ขึ้นไป)
4. สร้าง Web App ที่รองรับ Docker
5. ตั้งค่า Web App:
   - เลือกใช้ Docker Container
   - ตั้ง Docker Custom Image จาก Dockerfile ในโปรเจ็ค
   - เพิ่ม App Settings ตามที่กำหนดใน .env.production

## 4. การแก้ไขปัญหาอื่นๆ

### หากต้องการทดสอบเฉพาะ Backend:

ใช้คำสั่งต่อไปนี้เพื่อรัน backend เฉพาะที่:

```powershell
cd .\backend
python -m src.main
```

### หากต้องการทดสอบการเชื่อมต่อกับ Azure SQL:

```powershell
python -c "import pyodbc; print(pyodbc.drivers())"
```

## 5. การแก้ไขปัญหา Syntax ที่เกิดจาก esbuild

หากพบข้อผิดพลาดระหว่างการบิลด์ด้วย esbuild ให้ตรวจสอบ:

1. TypeScript เวอร์ชัน (ปัจจุบันใช้ 5.9.2)
2. การตั้งค่า `target` ใน esbuild.config.mjs ต้องเป็น ES2020 หรือสูงกว่า
3. ข้อผิดพลาดของ syntax ใน TypeScript files
