# ObsidianMind Pro - การบูรณาการกับบริการ Azure AI

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

### **การตั้งค่า:**
1. สร้าง Azure Translator resource ใน Azure Portal
2. รับ API key และ region
3. เพิ่มข้อมูลเหล่านี้ในการตั้งค่า ObsidianMind Pro:
   - Azure Translator API Key
   - Azure Translator Region
   - (ทางเลือก) Glossary IDs หรือ custom translations

## 🧠 **Azure OpenAI Service**

### **ความสามารถ:**
- ใช้ GPT-4 และรุ่นถัดไปจาก Microsoft
- การรักษาความปลอดภัยและความเป็นส่วนตัวระดับองค์กร
- การติดตามการใช้งานและประสิทธิภาพ
- ตัวเลือกการปรับแต่งข้อมูลส่วนบุคคล
- ไม่มีการแบ่งปันข้อมูลกับบุคคลที่สาม

### **การตั้งค่า:**
1. ขอสิทธิ์การเข้าถึง Azure OpenAI (ถ้ายังไม่มี)
2. สร้าง Azure OpenAI resource ใน Azure Portal
3. ติดตั้ง AI models ใน Azure OpenAI Studio
4. เพิ่มข้อมูลเหล่านี้ในการตั้งค่า ObsidianMind Pro:
   - Azure OpenAI API Key
   - Azure OpenAI Endpoint
   - Azure OpenAI Deployment IDs (รุ่นที่ติดตั้ง)
   - Azure OpenAI API Version

## 🔎 **Azure AI Search**

### **ความสามารถ:**
- ค้นหาแบบ semantic ด้วยความเข้าใจในบริบท
- Vector search สำหรับการค้นหาที่เกี่ยวข้องมากขึ้น
- ผสมผสานการค้นหาแบบต่างๆ ได้
- ตัวกรองและการจัดอันดับขั้นสูง
- รองรับหลายภาษาในการค้นหา

### **การตั้งค่า:**
1. สร้าง Azure AI Search resource
2. สร้าง index และ vector fields
3. เพิ่มข้อมูลเหล่านี้ในการตั้งค่า ObsidianMind Pro:
   - Azure AI Search Admin Key
   - Azure AI Search Service Endpoint
   - Azure AI Search Index Name
   - Vector Configuration Options

## 🤖 **Azure AI Projects Agent**

### **ความสามารถ:**
- สร้าง agents เฉพาะทางสำหรับงานต่างๆ
- การควบคุมรูปแบบและเนื้อหาที่สร้าง
- การวางแผนและจัดระเบียบเอกสาร
- เชื่อมโยงกับแหล่งข้อมูลภายนอก
- การติดตามและปรับปรุงผลลัพธ์

### **การตั้งค่า:**
1. ตั้งค่าบริการ Azure AI Projects
2. กำหนดค่า agents ตามความต้องการ
3. เพิ่มข้อมูลเหล่านี้ในการตั้งค่า ObsidianMind Pro:
   - Azure AI Projects API Key
   - Agent Configuration IDs
   - Agent Parameters

## 💾 **Azure Cosmos DB**

### **ความสามารถ:**
- เก็บข้อมูล embeddings และ vectors
- จัดเก็บประวัติการสนทนาและบริบท
- ขยายขนาดได้สำหรับฐานความรู้ขนาดใหญ่
- การรักษาความปลอดภัยและการสำรองข้อมูล
- ประสิทธิภาพการค้นหาที่รวดเร็ว

### **การตั้งค่า:**
1. สร้าง Azure Cosmos DB account
2. สร้าง database และ containers
3. เพิ่มข้อมูลเหล่านี้ในการตั้งค่า ObsidianMind Pro:
   - Cosmos DB Connection String
   - Database ID
   - Container IDs

## 🔄 **ขั้นตอนการตั้งค่าทั้งหมด**

1. **เตรียมทรัพยากร Azure:**
   - สร้างบัญชี Azure ถ้ายังไม่มี
   - สร้างทรัพยากร Azure ตามที่ต้องการใช้
   - บันทึก API keys และ endpoints ทั้งหมด

2. **ตั้งค่าใน ObsidianMind Pro:**
   - เปิดการตั้งค่า Plugin
   - ไปที่แท็บ "Azure Integration"
   - ป้อน API keys และ endpoints ที่เกี่ยวข้อง
   - ตรวจสอบการเชื่อมต่อด้วยปุ่ม "Test Connection"

3. **ทดสอบการทำงาน:**
   - ทดสอบการแปลเอกสาร
   - ทดสอบ AI chat ด้วย Azure OpenAI
   - ทดสอบการค้นหาด้วย Azure AI Search
   - ทดสอบ agents และ document generation

## 📊 **การเฝ้าติดตามและการปรับแต่ง**

- ติดตามการใช้ API และค่าใช้จ่ายใน Azure Portal
- ปรับแต่งการตั้งค่าเพื่อเพิ่มประสิทธิภาพหรือลดค่าใช้จ่าย
- ใช้ Azure Monitor เพื่อตรวจสอบประสิทธิภาพ
- สำรองข้อมูลสำคัญใน Azure Storage

## 🛠️ **การแก้ไขปัญหา**

### ปัญหาการเชื่อมต่อ:
- ตรวจสอบว่า API keys และ endpoints ถูกต้อง
- ตรวจสอบว่า resources ทำงานปกติใน Azure Portal
- ตรวจสอบการจำกัดการใช้งานและโควต้า
- ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต

### ข้อผิดพลาดของ Azure OpenAI:
- ตรวจสอบว่ารุ่นที่เลือกได้รับการติดตั้งและใช้งานได้
- ตรวจสอบการตั้งค่า deployment ID
- ดูบันทึกข้อผิดพลาดสำหรับข้อความข้อผิดพลาดที่เฉพาะเจาะจง

### ปัญหาการค้นหา:
- ตรวจสอบการกำหนดค่า index
- ตรวจสอบการตั้งค่า vector
- รีเฟรช index หรือสร้าง index ใหม่ถ้าจำเป็น

### การแก้ไขทั่วไป:
- รีสตาร์ท plugin
- ล้างแคชและตั้งค่าใหม่
- ตรวจสอบการอัปเดตล่าสุดของ plugin
- ติดต่อทีมสนับสนุนถ้าปัญหายังคงอยู่

## 📜 **อ้างอิง**

- [Azure AI Services Documentation](https://docs.microsoft.com/azure/ai-services/)
- [Azure OpenAI Service Documentation](https://docs.microsoft.com/azure/cognitive-services/openai/)
- [Azure AI Search Documentation](https://docs.microsoft.com/azure/search/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [ObsidianMind Pro Support Forum](https://github.com/yourusername/ObsidianMind-Pro/discussions)
