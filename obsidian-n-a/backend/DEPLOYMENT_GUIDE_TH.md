# ขั้นตอนการ Deploy Backend ไปยัง Azure App Service

## ขั้นตอนที่ 1: ติดตั้ง Azure CLI
1. ดาวน์โหลด Azure CLI จาก: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows
2. ติดตั้งตามขั้นตอนที่แนะนำ
3. รีสตาร์ท PowerShell หรือเปิด PowerShell ใหม่

## ขั้นตอนที่ 2: Login เข้า Azure
```powershell
az login
```

## ขั้นตอนที่ 3: รัน Deploy Script
```powershell
.\deploy.ps1 -ResourceGroup "ObsidianBackendRG" -AppName "obsidian-backend" -Location "eastus"
```
คุณสามารถเปลี่ยน ResourceGroup, AppName และ Location ได้ตามต้องการ

## หมายเหตุ:
- ตรวจสอบให้แน่ใจว่าคุณอยู่ในโฟลเดอร์ backend
- หากคุณต้องการใช้ Git Bash แทน PowerShell:
  ```bash
  ./deploy.sh ObsidianBackendRG obsidian-backend eastus
  ```
  แต่ต้องเปิด Git Bash และให้สิทธิ์การเรียกใช้งานไฟล์ก่อน:
  ```bash
  chmod +x deploy.sh
  ```

## ขั้นตอนการดู logs หลังจาก deploy:
```powershell
az webapp log tail --resource-group "ObsidianBackendRG" --name "obsidian-backend"
```
