# บริการใหม่ที่เพิ่มเข้ามาใน ObsidianMind Pro

เราได้เพิ่มบริการใหม่สำหรับการเชื่อมต่อกับ Azure AI Services ประกอบด้วย:

## 1. Azure AI Services

เพิ่มการรองรับ Azure AI Services แบบครบวงจร:

- **Azure OpenAI Service** - ใช้ AI models ที่ทรงพลังเพื่อการสร้างเนื้อหา
- **Azure AI Search** - ค้นหาด้วย semantic search และ vector search
- **Azure AI Projects Agent** - สร้างเอกสารอัตโนมัติด้วย AI
- **Azure Cosmos DB** - เก็บประวัติการสนทนาและข้อมูล

## 2. โครงสร้างโค้ดที่เพิ่มเข้ามา

1. **โมดูล `azure-services`** - โมดูลใหม่สำหรับการเชื่อมต่อกับ Azure AI Services:
   - `AzureAIService.ts` - คลาสหลักสำหรับการเชื่อมต่อกับ Azure AI Services
   - `AzureAgentService.ts` - สำหรับเชื่อมต่อกับ Azure AI Projects Agent
   - `AzureAISearchService.ts` - สำหรับเชื่อมต่อกับ Azure AI Search
   - `AzureCosmosDBService.ts` - สำหรับเชื่อมต่อกับ Azure Cosmos DB

2. **การตั้งค่าใหม่** - เพิ่มการตั้งค่าสำหรับ Azure AI Services ใน `settings.ts`:
   - Azure OpenAI (API Key, Endpoint, Deployment Name)
   - Azure AI Search (API Key, Endpoint, Index Name)
   - Azure Agent (Endpoint, API Key, Agent Name)
   - Azure Cosmos DB (Endpoint, Key, Database ID, Container ID)

3. **คำสั่งใหม่** - เพิ่มคำสั่งสำหรับการใช้งาน Azure AI Services:
   - "Generate Document with Azure Agent" - สร้างเอกสารด้วย Azure Agent
   - "Index Current Note to Azure AI Search" - เพิ่มโน้ตปัจจุบันลงใน Azure AI Search

## 3. วิธีการใช้งาน

1. **เปิดใช้งาน Azure AI Services** - ไปที่การตั้งค่าและเปิดใช้งาน Azure AI Services
2. **ตั้งค่า API Keys และ Endpoints** - กรอก API Keys และ Endpoints สำหรับบริการที่ต้องการใช้
3. **ใช้คำสั่งที่เพิ่มเข้ามา** - ใช้คำสั่งใหม่เพื่อสร้างเอกสารหรือเพิ่มโน้ตลงใน Azure AI Search

## 4. ตัวอย่างการใช้งาน

### การสร้างเอกสารด้วย Azure Agent:
1. เปิดใช้งาน Azure Agent ในการตั้งค่า
2. ใช้คำสั่ง "Generate Document with Azure Agent"
3. ระบบจะสร้างเอกสารตามเทมเพลตที่กำหนดและบันทึกเป็นไฟล์ใหม่

### การเพิ่มโน้ตลงใน Azure AI Search:
1. เปิดโน้ตที่ต้องการเพิ่ม
2. ใช้คำสั่ง "Index Current Note to Azure AI Search"
3. โน้ตจะถูกเพิ่มลงใน Azure AI Search และสามารถค้นหาได้

## 5. ประโยชน์ที่ได้รับ

- **สร้างเอกสารอัตโนมัติ** - สร้างเอกสารที่มีคุณภาพสูงด้วย AI
- **ค้นหาอัจฉริยะ** - ค้นหาเนื้อหาด้วย semantic search และ vector search
- **จัดเก็บประวัติการสนทนา** - เก็บประวัติการสนทนาใน Cosmos DB
- **ผสานกับ RAG** - ใช้ Azure AI Search กับระบบ RAG ที่มีอยู่เดิม
