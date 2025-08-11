# Obsidian AI Plugin - Enhanced Version

ปลั๊กอิน AI สำหรับ Obsidian ที่มาพร้อมกับฟีเจอร์ขั้นสูง รวมถึง RAG (Retrieval-Augmented Generation), Embedding, และการเชื่อมต่อกับ Notion และ Airtable

## ✨ ฟีเจอร์หลัก

### 🤖 AI Chat Interface
- **Enhanced Chat UI**: อินเทอร์เฟซแชทที่ทันสมัยและใช้งานง่าย
- **Multiple AI Models**: รองรับโมเดล AI หลากหลายจากผู้ให้บริการชั้นนำ
- **Streaming Responses**: การตอบสนองแบบ real-time
- **File Attachments**: แนบไฟล์และรูปภาพในการสนทนา

### 🧠 RAG & Embedding
- **Smart Search**: ค้นหาข้อมูลในโน๊ตด้วย AI อย่างชาญฉลาด
- **Lightweight Embedding**: โมเดล embedding ที่เบาและมีประสิทธิภาพ
- **Context-Aware**: ตอบคำถามโดยอ้างอิงจากเนื้อหาในโน๊ต
- **Large Context Support**: รองรับเนื้อหาได้มากถึง 100,000 ตัวอักษร

### 🔗 Platform Integration
- **Notion Sync**: ซิงค์ข้อมูลกับ Notion Database
- **Airtable Integration**: เชื่อมต่อและซิงค์กับ Airtable
- **Auto Sync**: ซิงค์อัตโนมัติตามเวลาที่กำหนด

### ⚡ Advanced Features
- **Custom Tools**: เครื่องมือที่กำหนดเองได้
- **Templater Integration**: ทำงานร่วมกับ Templater plugin
- **Prompt Generator**: สร้าง prompt อัตโนมัติ
- **Macro Commands**: คำสั่งแมโครสำหรับงานซ้ำ

## 🚀 การติดตั้ง

### วิธีที่ 1: Manual Installation (แนะนำ)

1. **ดาวน์โหลดไฟล์ปลั๊กอิน**
   - ดาวน์โหลด `obsidian-ai-plugin-enhanced.zip`
   - แตกไฟล์ zip

2. **คัดลอกไฟล์ไปยัง Obsidian**
   ```
   [Vault]/.obsidian/plugins/obsidian-ai-enhanced/
   ├── main.js
   ├── manifest.json
   ├── styles.css
   └── README.md
   ```

3. **เปิดใช้งานปลั๊กอิน**
   - เปิด Obsidian Settings
   - ไปที่ Community Plugins
   - เปิดใช้งาน "Obsidian AI Enhanced"

### วิธีที่ 2: BRAT Installation

1. ติดตั้ง BRAT plugin
2. เพิ่ม repository URL
3. ติดตั้งผ่าน BRAT

## ⚙️ การตั้งค่า

### Backend Service

ปลั๊กอินนี้ต้องการ Backend Service เพื่อการทำงานที่สมบูรณ์:

1. **ติดตั้ง Python Dependencies**
   ```bash
   pip install fastapi uvicorn sentence-transformers chromadb aiohttp
   ```

2. **เริ่มต้น Backend Service**
   ```bash
   cd backend
   python src/main.py
   ```

3. **ตั้งค่า Backend URL**
   - เปิด Plugin Settings
   - ตั้งค่า Backend URL เป็น `http://localhost:8000`

### API Keys

ตั้งค่า API keys ในส่วน Settings:

- **OpenAI API Key**: สำหรับ GPT models
- **Anthropic API Key**: สำหรับ Claude models
- **Notion Integration Token**: สำหรับ Notion sync
- **Airtable Access Token**: สำหรับ Airtable integration

## 📖 การใช้งาน

### เริ่มต้นใช้งาน

1. **เปิด AI Chat**
   - คลิกไอคอน robot ใน ribbon
   - หรือใช้คำสั่ง "Open AI Chat"

2. **ตั้งค่าโมเดล AI**
   - เลือกโมเดลจาก dropdown
   - ปรับ temperature และ max tokens

3. **เริ่มสนทนา**
   - พิมพ์คำถามในช่องแชท
   - แนบไฟล์หรือรูปภาพได้

### ฟีเจอร์ขั้นสูง

#### RAG Search
```
ค้นหาข้อมูลเกี่ยวกับ "machine learning" ในโน๊ตของฉัน
```

#### Notion Sync
```
/sync-notion [database-id]
```

#### Custom Tools
```
/tool [tool-name] [parameters]
```

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Backend Connection Failed**
   - ตรวจสอบว่า Backend Service ทำงานอยู่
   - ตรวจสอบ Backend URL ใน settings

2. **API Key Invalid**
   - ตรวจสอบ API key ใน settings
   - ตรวจสอบ quota และ permissions

3. **Embedding Process Slow**
   - ลดจำนวนไฟล์ที่ประมวลผล
   - ใช้โมเดล embedding ที่เบากว่า

### Debug Mode

เปิด Debug Mode ใน settings เพื่อดู logs:
- เปิด Developer Console (Ctrl+Shift+I)
- ดู console logs สำหรับข้อมูล debug

## 📚 เอกสารเพิ่มเติม

- [User Manual](USER_MANUAL.md) - คู่มือการใช้งานแบบละเอียด
- [Examples](EXAMPLES.md) - ตัวอย่างการใช้งาน
- [API Documentation](API_DOCS.md) - เอกสาร API

## 🤝 การสนับสนุน

- **GitHub Issues**: รายงานปัญหาหรือขอฟีเจอร์ใหม่
- **Discord**: เข้าร่วมชุมชนผู้ใช้งาน
- **Email**: ติดต่อทีมพัฒนา

## 📄 License

MIT License - ดูรายละเอียดใน [LICENSE](LICENSE) file

## 🙏 Credits

- Obsidian Team สำหรับ platform ที่ยอดเยี่ยม
- OpenAI, Anthropic สำหรับ AI models
- Sentence Transformers สำหรับ embedding models
- ชุมชน Obsidian สำหรับการสนับสนุน

---

**Version**: 1.0.0  
**Last Updated**: August 2025  
**Compatibility**: Obsidian 1.0.0+

