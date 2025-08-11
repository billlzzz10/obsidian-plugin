# คู่มือการติดตั้ง Obsidian AI Plugin Enhanced

## 📋 ความต้องการของระบบ

### สำหรับ Frontend (Obsidian Plugin)
- **Obsidian**: เวอร์ชัน 1.0.0 หรือใหม่กว่า
- **Operating System**: Windows, macOS, หรือ Linux
- **Memory**: RAM อย่างน้อย 4GB (แนะนำ 8GB)
- **Storage**: พื้นที่ว่างอย่างน้อย 100MB

### สำหรับ Backend Service (ไม่บังคับ แต่แนะนำ)
- **Python**: เวอร์ชัน 3.8 หรือใหม่กว่า
- **Memory**: RAM อย่างน้อย 2GB สำหรับ embedding models
- **Storage**: พื้นที่ว่างอย่างน้อย 1GB สำหรับ models และ cache

## 🚀 การติดตั้งแบบ Quick Start

### ขั้นตอนที่ 1: ติดตั้ง Plugin

1. **ดาวน์โหลดไฟล์ปลั๊กอิน**
   - ดาวน์โหลด `obsidian-ai-plugin-enhanced.zip`
   - แตกไฟล์ zip ออกมา

2. **คัดลอกไฟล์ไปยัง Obsidian Vault**
   ```
   [Your Vault]/.obsidian/plugins/obsidian-ai-enhanced/
   ├── main.js
   ├── manifest.json
   ├── styles/
   └── README.md
   ```

3. **เปิดใช้งานปลั๊กอิน**
   - เปิด Obsidian
   - ไปที่ Settings → Community Plugins
   - ค้นหา "Obsidian AI Enhanced"
   - เปิดใช้งาน toggle

### ขั้นตอนที่ 2: การตั้งค่าเบื้องต้น

1. **เปิด Plugin Settings**
   - ไปที่ Settings → Community Plugins
   - คลิก gear icon ข้าง "Obsidian AI Enhanced"

2. **ตั้งค่า API Keys**
   - **OpenAI API Key**: ใส่ API key จาก OpenAI
   - **Anthropic API Key**: ใส่ API key จาก Anthropic (ไม่บังคับ)

3. **ทดสอบการทำงาน**
   - คลิกไอคอน robot ใน ribbon
   - พิมพ์ "Hello" เพื่อทดสอบ

## 🔧 การติดตั้ง Backend Service (Advanced)

### ขั้นตอนที่ 1: ติดตั้ง Python Dependencies

```bash
# สร้าง virtual environment
python -m venv obsidian-ai-env

# เปิดใช้งาน virtual environment
# Windows:
obsidian-ai-env\Scripts\activate
# macOS/Linux:
source obsidian-ai-env/bin/activate

# ติดตั้ง dependencies
pip install fastapi uvicorn sentence-transformers chromadb aiohttp python-multipart
```

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables

สร้างไฟล์ `.env`:
```env
# AI Model API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Integration API Keys
NOTION_INTEGRATION_TOKEN=your_notion_token_here
AIRTABLE_ACCESS_TOKEN=your_airtable_token_here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Database Configuration
DATABASE_URL=sqlite:///./data/obsidian_ai.db
VECTOR_DB_PATH=./data/vector_db

# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=3600
```

### ขั้นตอนที่ 3: เริ่มต้น Backend Service

```bash
# ไปยังโฟลเดอร์ backend
cd backend

# เริ่มต้น server
python src/main.py

# หรือใช้ uvicorn
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### ขั้นตอนที่ 4: ตั้งค่า Plugin ให้เชื่อมต่อ Backend

1. เปิด Plugin Settings
2. ตั้งค่า Backend URL เป็น `http://localhost:8000`
3. คลิก "Test Connection" เพื่อทดสอบ

## 📱 การติดตั้งบน Mobile (iOS/Android)

### iOS (iPhone/iPad)
1. ติดตั้ง Obsidian จาก App Store
2. ใช้ iCloud หรือ Dropbox เพื่อซิงค์ vault
3. Plugin จะทำงานอัตโนมัติ (ไม่ต้องติดตั้งแยก)

### Android
1. ติดตั้ง Obsidian จาก Google Play Store
2. ใช้ Google Drive หรือ Dropbox เพื่อซิงค์ vault
3. Plugin จะทำงานอัตโนมัติ

**หมายเหตุ**: Backend service ไม่สามารถทำงานบน mobile ได้ ต้องใช้ cloud service หรือ remote server

## 🌐 การติดตั้งบน Cloud Server

### ใช้ Docker (แนะนำ)

1. **สร้าง Dockerfile**:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .
EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. **Build และ Run**:
```bash
docker build -t obsidian-ai-backend .
docker run -p 8000:8000 -e OPENAI_API_KEY=your_key obsidian-ai-backend
```

### ใช้ Railway/Heroku

1. **สร้าง requirements.txt**
2. **สร้าง Procfile**:
```
web: uvicorn src.main:app --host 0.0.0.0 --port $PORT
```
3. **Deploy ตาม platform documentation**

## 🔍 การแก้ไขปัญหาการติดตั้ง

### ปัญหา: Plugin ไม่แสดงใน Community Plugins

**วิธีแก้**:
1. ตรวจสอบว่าไฟล์อยู่ในโฟลเดอร์ที่ถูกต้อง
2. ตรวจสอบว่า manifest.json มีรูปแบบที่ถูกต้อง
3. Restart Obsidian
4. เปิด Developer Console (Ctrl+Shift+I) เพื่อดู error messages

### ปัญหา: Backend Connection Failed

**วิธีแก้**:
1. ตรวจสอบว่า Backend service ทำงานอยู่:
   ```bash
   curl http://localhost:8000/health
   ```
2. ตรวจสอบ firewall settings
3. ตรวจสอบ Backend URL ใน plugin settings

### ปัญหา: API Key Invalid

**วิธีแก้**:
1. ตรวจสอบ API key ใน settings
2. ตรวจสอบ quota และ billing ใน provider dashboard
3. ตรวจสอบ permissions ของ API key

### ปัญหา: Embedding Process ช้า

**วิธีแก้**:
1. ใช้โมเดล embedding ที่เบากว่า (all-MiniLM-L6-v2)
2. ลดจำนวนไฟล์ที่ประมวลผลในครั้งเดียว
3. เพิ่ม RAM หรือใช้ SSD

## 📊 การตรวจสอบการติดตั้ง

### ตรวจสอบ Plugin
```javascript
// เปิด Developer Console ใน Obsidian
console.log(app.plugins.plugins['obsidian-ai-enhanced']);
```

### ตรวจสอบ Backend
```bash
# ตรวจสอบ health endpoint
curl http://localhost:8000/health

# ตรวจสอบ API documentation
curl http://localhost:8000/docs
```

### ตรวจสอบ Dependencies
```bash
# ตรวจสอบ Python packages
pip list | grep -E "(fastapi|sentence-transformers|chromadb)"

# ตรวจสอบ Node.js (สำหรับ development)
node --version
npm --version
```

## 🔄 การอัปเดต

### อัปเดต Plugin
1. ดาวน์โหลดเวอร์ชันใหม่
2. แทนที่ไฟล์เก่า
3. Restart Obsidian

### อัปเดต Backend
```bash
# อัปเดต dependencies
pip install --upgrade -r requirements.txt

# Restart service
```

## 📞 การขอความช่วยเหลือ

หากพบปัญหาในการติดตั้ง:

1. **ตรวจสอบ logs**:
   - Obsidian: Developer Console (Ctrl+Shift+I)
   - Backend: Terminal output

2. **รายงานปัญหา**:
   - GitHub Issues
   - Discord community
   - Email support

3. **ข้อมูลที่ต้องแนบ**:
   - Operating System และ version
   - Obsidian version
   - Error messages
   - Steps to reproduce

---

**หมายเหตุ**: คู่มือนี้อัปเดตสำหรับเวอร์ชัน 1.0.0 หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมพัฒนา

