# ObsidianMind Pro – คู่มือสำหรับ AI Coding Agent (ภาษาไทย)

## สถาปัตยกรรมโปรเจค & แนวคิดสำคัญ
- **ปลั๊กอิน AI แบบโมดูลาร์สำหรับ Obsidian**: โค้ดนี้คือปลั๊กอิน TypeScript/React สำหรับ Obsidian รองรับ LLM chat, RAG (Retrieval-Augmented Generation), embedding ในเครื่อง, และเชื่อมต่อหลายแหล่งข้อมูล (Notion, Airtable, Zapier, Figma, Azure)
- **องค์ประกอบหลัก**:
  - main.ts: จุดเริ่มต้นของปลั๊กอิน, สร้างและเชื่อมต่อ service/manager ทุกตัว
  - AIModelManager.ts: จัดการเลือก LLM และ route API (OpenAI, Anthropic, Google, Azure)
  - EmbeddingManager.ts & VectorStore.ts: จัดการเวกเตอร์และค้นหา context สำหรับ RAG
  - src/modules/data-ingestion/NotionAPI.ts, AirtableAPI.ts: ดึงข้อมูลภายนอก
  - src/modules/advanced-features/MCPServiceManager.ts: จัดการ MCP services (Notion, Zapier, Figma)
  - src/ui/: React UI (chat, settings ฯลฯ)
- **Data Flow**: รับข้อความ → ChatService → (RAGService + AIModelManager) → LLM API → ตอบกลับ (อาจมี context จาก embedding/แหล่งข้อมูล)
- **การตั้งค่า**: ทุกอย่างอยู่ใน settings.ts (API key, เลือกโมเดล, MCP services ฯลฯ)

## Dependencies & การจัดการปัญหาที่พบบ่อย
- **เวอร์ชั่นสำคัญ**: Node.js v18-20, React 18, TypeScript 5.9, ES2020 target (สำคัญมาก!)
- **Dependencies หลัก**:
  - @xenova/transformers: สำหรับ embedding บนเครื่อง (ต้องการ ES2020+ เพราะใช้ BigInt literals)
  - onnxruntime-web: รันโมเดล ML บนเบราว์เซอร์
  - react/react-dom: UI components
  - zustand: จัดการ state

- **ปัญหาที่พบบ่อย**:
  - BigInt literals: ต้องตั้ง target เป็น ES2020 ทั้งใน tsconfig.json และ esbuild.config.mjs
  - React 18/19 conflicts: ต้องใช้เวอร์ชั่นตรงกัน
  - Node.js compatibility: แนะนำใช้ v18-20 ตาม CI config

- **แก้ไขปัญหา Dependencies**:
  - ใช้ `npm ci` แทน `npm install` เพื่อติดตั้งตรงตาม package-lock.json
  - เช็ค CI workflow ใน `.github/workflows/ci.yml` สำหรับขั้นตอนการติดตั้งที่ถูกต้อง
  - Dependabot จัดการอัพเดต dependencies โดยอัตโนมัติทุกสัปดาห์

## เวิร์กโฟลว์สำหรับนักพัฒนา
- **Build**: ใช้ `npm run build` (TypeScript + esbuild, ได้ main.js) / dev ใช้ `npm run dev`
- **Test**: ใช้ `npm test` (Jest) ไฟล์ทดสอบอยู่ใน test/ และ tests/
- **Lint/Format**: `npm run lint`, `npm run format`
- **ติดตั้งปลั๊กอิน**: copy โฟลเดอร์ build ไปที่ `.obsidian/plugins/ObsidianMind Pro` ใน vault
- **External Services**:
  - Notion: ต้องใช้ integration token และ database ID
  - Azure: ต้องใช้ Translator API key, endpoint, region
  - Zapier/Figma: ตั้งค่าผ่าน MCP services ใน settings

## รูปแบบ/แนวปฏิบัติเฉพาะโปรเจค
- **Service Manager**: ทุกฟีเจอร์หลัก (embedding, RAG, chat, integration) แยกเป็นคลาส manager/service และสร้างใน main.ts
- **Settings Pattern**: ตัวเลือกทั้งหมดอยู่ใน interface `AIPluginSettings` และต้องอัปเดต `DEFAULT_SETTINGS` ทุกครั้งที่เพิ่ม option
- **MCP Services**: เพิ่ม integration ใหม่โดยขยาย MCPServiceManager และอัปเดต settings.ts (`mcpServices`)
- **Embedding**: ทุกเวกเตอร์ต้องผ่าน EmbeddingManager/VectorStore เท่านั้น
- **UI**: ทุกฟีเจอร์ที่ user เห็นเป็น React component ใน src/ui/
- **Testing**: ใช้ Jest, วางไฟล์ใน test/ หรือ tests/
- **Security**: ห้าม hardcode API key, ใช้ env variable หรือ plugin settings เท่านั้น

## การเชื่อมต่อข้ามโมดูล
- **LLM API**: เรียกผ่าน AIModelManager เท่านั้น
- **RAG**: ใช้ RAGService ดึง context (ประสานกับ EmbeddingManager/VectorStore)
- **External Data**: ใช้ DataIngestionManager ดึงข้อมูล Notion/Airtable (UI ห้าม fetch ตรง)
- **MCP**: ทุก service MCP ต้องผ่าน MCPServiceManager

## ตัวอย่าง
- **เพิ่ม LLM ใหม่**: อัปเดต SUPPORTED_MODELS ใน constants.ts, ขยาย AIModelManager, เพิ่ม config ใน settings.ts
- **เพิ่ม MCP service ใหม่**: ขยาย MCPServiceManager, เพิ่ม config ใน settings.ts, เขียนคู่มือใน MCP_SERVICES_GUIDE.md
- **เพิ่ม UI ใหม่**: สร้าง React component ใน src/ui/, register ใน main.ts ถ้าจำเป็น

## อ้างอิง
- ดู README.md, INSTALLATION.md, MCP_SERVICES_GUIDE.md, AZURE_INTEGRATION_GUIDE.md สำหรับวิธีใช้/ตั้งค่า/เชื่อมต่อ
- คำสั่ง build/test/lint ดูใน package.json

---
## Codacy Rules (Preserved)
- IMMEDIATELY after ANY successful `edit_file` or `reapply` operation, run the `codacy_cli_analyze` tool with:
 - `rootPath`: set to the workspace path
 - `file`: set to the path of the edited file
- If any issues are found, propose and apply fixes for them.

- After adding dependencies (npm install, package.json changes), run the `codacy_cli_analyze` tool with:
 - `rootPath`: set to the workspace path
 - `tool`: set to "trivy"
- Fix any vulnerabilities before continuing with other tasks.

- When `codacy_cli_analyze` with `repository` or `organization` returns a 404 error, offer to run `codacy_setup_repository`.