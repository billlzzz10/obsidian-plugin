# ObsidianMind Pro - Azure AI Services Integration

## 🔵 **ภาพรวม Azure Integration**

ObsidianMind Pro รองรับการเชื่อมต่อกับ **Azure AI Services** เพื่อเพิ่มความสามารถด้าน AI และการแปลภาษา ซึ่งประกอบด้วย:

1. **Azure Translator Service** - บริการแปลภาษาคุณภาพสูง
2. **Azure OpenAI Service** - AI models ที่ทรงพลังเพื่อการสร้างเนื้อหา
3. **Azure AI Search** - ค้นหาด้วย semantic search และ vector search
4. **Azure AI Projects Agent** - สร้างเอกสารอัตโนมัติด้วย AI
5. **Azure Cosmos DB** - เก็บประวัติการสนทนาและข้อมูล

## 🗣️ **Azure Translator Service**

### **ความสามารถ:**
- แปลข้อความระหว่าง 100+ ภาษา
- ตรวจจับภาษาอัตโนมัติ
- แปล batch ขนาดใหญ่
- คุณภาพการแปลระดับ Enterprise
- รองรับ custom models และ glossaries

### **การใช้งานใน ObsidianMind Pro:**

#### 1. **แปลโน้ตแบบ Real-time**
```
User: "แปลโน้ตนี้เป็นภาษาไทย"
AI: จะใช้ Azure Translator แปลเนื้อหาให้คุณ พร้อมรักษา formatting
```

#### 2. **Multi-language Notes**
- สร้างโน้ตหลายภาษาพร้อมกัน
- แปลส่วนเฉพาะที่เลือก
- รักษา markdown formatting
- แปล tables และ lists

#### 3. **Batch Translation**
- แปลหลายไฟล์พร้อมกัน
- แปล folders ทั้งหมด
- Queue system สำหรับงานใหญ่
- Progress tracking

#### 4. **Smart Context Translation**
- ใช้ context จากโน้ตอื่นๆ
- รักษาความหมายเฉพาะ domain
- แปลคำศัพท์เทคนิคถูกต้อง
- Custom glossaries สำหรับแต่ละโปรเจค

## ⚙️ **การติดตั้งและตั้งค่า**

### 🔧 **ขั้นตอนที่ 1: สร้าง Azure Resources**

#### **ใน Azure Portal:**
1. ไปที่ [Azure Portal](https://portal.azure.com)
2. คลิก "Create a resource"

#### **สำหรับ Azure Translator:**
1. ค้นหา "Translator"
2. เลือก "Translator" service
3. กรอกข้อมูลที่จำเป็น (Resource group, Region, Pricing tier)
4. คลิก "Review + create" และ "Create"

#### **สำหรับ Azure OpenAI:**
1. ค้นหา "Azure OpenAI"
2. เลือก "Azure OpenAI" service
3. กรอกข้อมูลที่จำเป็น
4. หลังจากสร้างเสร็จ ให้ deploy model ที่ต้องการใช้
5. บันทึก API Key, Endpoint และ Deployment name

#### **สำหรับ Azure AI Search:**
1. ค้นหา "Azure AI Search"
2. เลือก "Azure AI Search" service
3. กรอกข้อมูลที่จำเป็น
4. หลังจากสร้างเสร็จ ให้สร้าง index ที่จะใช้
5. บันทึก API Key, Endpoint และ Index name

#### **สำหรับ Azure AI Projects Agent:**
1. ค้นหา "Azure AI Studio"
2. เข้าใช้งาน Azure AI Studio
3. สร้าง AI Project และ Agent
4. บันทึก Endpoint, API Key และ Agent name

#### **สำหรับ Azure Cosmos DB:**
1. ค้นหา "Azure Cosmos DB"
2. เลือก "Azure Cosmos DB" service
3. เลือก API type (SQL)
4. กรอกข้อมูลที่จำเป็น
5. สร้าง database และ container
6. บันทึก Endpoint, Key, Database ID และ Container ID
5. กรอกข้อมูล:
   ```
   Name: obsidian-translator
   Region: Southeast Asia (หรือที่ใกล้ที่สุด)
   Pricing Tier: F0 (Free) หรือ S1 (Standard)
   ```
6. คลิก "Review + Create"

#### **หลังสร้างเสร็จ:**
1. ไปที่ resource ที่สร้าง
2. คลิก "Keys and Endpoint"
3. คัดลอก:
   - **Key 1** หรือ **Key 2**
   - **Endpoint URL**
   - **Region**

### 🔧 **ขั้นตอนที่ 2: ตั้งค่าใน ObsidianMind Pro**

#### **ใน Plugin Settings:**
1. เปิด Obsidian Settings
2. ไปที่ "ObsidianMind Pro"
3. หา section "Azure AI Services"
4. กรอกข้อมูล:
   ```
   Azure API Key: [คีย์ที่คัดลอกจาก Azure]
   Azure Endpoint: [URL endpoint]
   Azure Region: [region code เช่น southeastasia]
   ```
5. คลิก "Test Connection" เพื่อทดสอบ
6. บันทึกการตั้งค่า

### 🔧 **ขั้นตอนที่ 3: ตั้งค่า Environment Variables (แนะนำ)**

#### **สำหรับ Windows:**
```powershell
# เปิด PowerShell เป็น Administrator
[Environment]::SetEnvironmentVariable("AZURE_TRANSLATOR_KEY", "your-key-here", "Machine")
[Environment]::SetEnvironmentVariable("AZURE_TRANSLATOR_ENDPOINT", "your-endpoint-here", "Machine")
[Environment]::SetEnvironmentVariable("AZURE_TRANSLATOR_REGION", "southeastasia", "Machine")
```

#### **สำหรับ macOS/Linux:**
```bash
# เพิ่มใน ~/.bashrc หรือ ~/.zshrc
export AZURE_TRANSLATOR_KEY="your-key-here"
export AZURE_TRANSLATOR_ENDPOINT="your-endpoint-here"
export AZURE_TRANSLATOR_REGION="southeastasia"
```

## 🚀 **การใช้งาน**

### 💬 **ผ่าน Chat Interface:**

#### **แปลข้อความทั่วไป:**
```
User: "แปลข้อความนี้เป็นภาษาญี่ปุ่น: Hello, how are you today?"
AI: "こんにちは、今日はいかがですか？"

User: "แปลเป็นไทย: Good morning everyone"
AI: "สวัสดีตอนเช้าทุกคน"
```

#### **แปลโน้ตทั้งไฟล์:**
```
User: "แปลไฟล์ README.md เป็นภาษาไทย"
AI: "กำลังแปลไฟล์ README.md เป็นภาษาไทย..."
     "เสร็จแล้ว! สร้างไฟล์ README.th.md เรียบร้อย"

User: "แปลโฟลเดอร์ docs ทั้งหมดเป็นภาษาจีน"
AI: "กำลังแปล 15 ไฟล์ในโฟลเดอร์ docs..."
     "Progress: 3/15 completed..."
```

#### **แปลแบบมี Context:**
```
User: "แปลโน้ตนี้เป็นภาษาอังกฤษ โดยรักษาความหมายทางเทคนิค"
AI: "กำลังแปลโดยใช้ technical glossary และ context จากโน้ตอื่นๆ..."

User: "แปลเฉพาะส่วนที่เลือกเป็นภาษาฝรั่งเศส"
AI: "แปลเฉพาะข้อความที่เลือกเรียบร้อย"
```

### ⚡ **ฟีเจอร์ขั้นสูง:**

#### **1. Smart Translation:**
- ตรวจจับภาษาต้นทางอัตโนมัติ
- รักษา markdown formatting
- แปลเฉพาะเนื้อหา ไม่แปล code blocks
- รักษา links และ references

#### **2. Technical Glossary:**
- Custom dictionary สำหรับแต่ละโปรเจค
- แปลคำศัพท์เทคนิคถูกต้อง
- รักษาชื่อบริษัทและ product names
- จัดการ abbreviations และ acronyms

#### **3. Batch Processing:**
- แปลหลายไฟล์พร้อมกัน
- Queue management
- Resume งานที่ขัดจังหวะ
- Progress tracking และ logging

#### **4. Quality Control:**
- ตรวจสอบคุณภาพการแปล
- Compare กับ previous versions
- Confidence scoring
- Manual review suggestions

## 📊 **Pricing และ Limits**

### **Azure Translator Pricing:**
- **Free Tier (F0)**: 2M characters/month
- **Standard (S1)**: $10/1M characters
- **Premium**: Custom pricing

### **Rate Limits:**
- **Free**: 1000 requests/hour
- **Standard**: 10,000 requests/hour
- **Premium**: Custom limits

### **Best Practices:**
- ใช้ batch translation สำหรับไฟล์ใหญ่
- Cache การแปลเพื่อลด costs
- ใช้ custom models สำหรับ domain เฉพาะ
- Monitor usage ผ่าน Azure Portal

## 🔒 **Security และ Privacy**

- **Data Encryption**: ข้อมูลเข้ารหัสระหว่างส่ง
- **Regional Processing**: เลือก region ที่เหมาะสม
- **No Data Retention**: Azure ไม่เก็บข้อมูลที่แปล
- **API Key Security**: เก็บ keys ใน environment variables

## 🐛 **Troubleshooting**

### **ปัญหาทั่วไป:**

#### **Connection Error:**
```
✗ Error: 401 Unauthorized
→ ตรวจสอบ API key
→ ตรวจสอบ region setting
→ ตรวจสอบ endpoint URL
```

#### **Rate Limit Exceeded:**
```
✗ Error: 429 Too Many Requests
→ รอครู่แล้วลองใหม่
→ ลด batch size
→ อัพเกรด pricing tier
```

#### **Translation Quality Issues:**
```
✗ แปลผิด context
→ เพิ่ม custom glossary
→ ใช้ longer text chunks
→ ปรับ confidence threshold
```

#### **Performance Issues:**
```
✗ แปลช้า
→ ลด chunk size
→ ใช้ parallel processing
→ ตรวจสอบ network connection
```

## 🎯 **Advanced Configuration**

### **Custom Models:**
```json
{
  "customModels": [
    {
      "name": "Technical Documentation",
      "source": "en",
      "target": "th",
      "glossary": "tech-terms.json",
      "confidence": 0.8
    }
  ]
}
```

### **Batch Configuration:**
```json
{
  "batchSettings": {
    "maxConcurrent": 5,
    "chunkSize": 5000,
    "retryAttempts": 3,
    "timeout": 30000
  }
}
```

### **Quality Settings:**
```json
{
  "qualityControl": {
    "enableValidation": true,
    "minConfidence": 0.7,
    "preserveFormatting": true,
    "skipCodeBlocks": true
  }
}
```

---

## ✨ **ผลลัพธ์ที่ได้**

หลังจากตั้งค่า Azure Integration:

✅ **Professional Translation** - คุณภาพการแปลระดับ Enterprise  
✅ **Multi-language Support** - รองรับ 100+ ภาษา  
✅ **Preserved Formatting** - รักษา markdown และ structure  
✅ **Technical Accuracy** - แปลเนื้อหาเทคนิคถูกต้อง  
✅ **Batch Processing** - แปลไฟล์จำนวนมากได้  
✅ **Cost Effective** - ใช้ Azure pricing ที่คุ้มค่า  

🌟 **ObsidianMind Pro พร้อมเป็น Global Knowledge Hub!**
