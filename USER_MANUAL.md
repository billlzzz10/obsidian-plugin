# คู่มือการใช้งาน Obsidian AI Plugin Enhanced

## 📚 สารบัญ

1. [การเริ่มต้นใช้งาน](#การเริ่มต้นใช้งาน)
2. [AI Chat Interface](#ai-chat-interface)
3. [RAG & Smart Search](#rag--smart-search)
4. [Platform Integration](#platform-integration)
5. [Advanced Features](#advanced-features)
6. [Settings & Configuration](#settings--configuration)
7. [Tips & Best Practices](#tips--best-practices)

## 🚀 การเริ่มต้นใช้งาน

### เปิด AI Chat

มีหลายวิธีในการเปิด AI Chat:

1. **Ribbon Icon**: คลิกไอคอน 🤖 ใน ribbon bar
2. **Command Palette**: กด `Ctrl+P` แล้วพิมพ์ "Open AI Chat"
3. **Hotkey**: ตั้งค่า hotkey ใน Settings → Hotkeys

### การตั้งค่าเบื้องต้น

1. **เลือกโมเดล AI**:
   - คลิก dropdown ที่มุมขวาบนของ chat interface
   - เลือกโมเดลที่ต้องการ (GPT-3.5, GPT-4, Claude, etc.)

2. **ตั้งค่า API Key**:
   - ไปที่ Settings → Community Plugins → Obsidian AI Enhanced
   - ใส่ API key ของโมเดลที่ต้องการใช้

## 💬 AI Chat Interface

### การสนทนาพื้นฐาน

```
👤 User: สวัสดี ช่วยอธิบายเกี่ยวกับ machine learning หน่อย

🤖 AI: สวัสดีครับ! Machine Learning หรือการเรียนรู้ของเครื่อง คือ...
```

### การแนบไฟล์

1. **แนบรูปภาพ**:
   - คลิกไอคอน 📎 ข้างช่องพิมพ์ข้อความ
   - เลือกไฟล์รูปภาพ (.jpg, .png, .gif)
   - AI จะวิเคราะห์รูปภาพและตอบคำถาม

2. **แนบเอกสาร**:
   - รองรับไฟล์ .txt, .md, .pdf
   - AI จะอ่านเนื้อหาและใช้เป็นบริบท

### Message Actions

แต่ละข้อความมี actions ที่สามารถใช้ได้:

- **Copy**: คัดลอกข้อความ
- **Retry**: ลองถามใหม่
- **Edit**: แก้ไขข้อความ (สำหรับ user messages)

### การใช้งาน Streaming

เมื่อเปิด streaming mode:
- ข้อความจะแสดงทีละคำ
- สามารถหยุดการตอบสนองได้ตลอดเวลา
- ประหยัด token และเวลา

## 🧠 RAG & Smart Search

### การค้นหาในโน๊ต

```
👤 User: ค้นหาข้อมูลเกี่ยวกับ "project management" ในโน๊ตของฉัน

🤖 AI: ฉันพบข้อมูลเกี่ยวกับ project management ในโน๊ตต่อไปนี้:

📄 **Project Planning.md**
- การวางแผนโปรเจกต์แบบ Agile
- เครื่องมือที่แนะนำ: Trello, Asana

📄 **Meeting Notes 2024-01-15.md**  
- การประชุมเรื่อง project timeline
- ปัญหาที่พบและแนวทางแก้ไข

ต้องการให้ฉันอธิบายรายละเอียดเพิ่มเติมหรือไม่?
```

### การตั้งค่า RAG

1. **เปิดใช้งาน RAG**:
   - ไปที่ Settings → RAG Settings
   - เปิด "Enable RAG"

2. **ประมวลผลโน๊ต**:
   - คลิก "Process Current Vault"
   - รอให้ระบบสร้าง embeddings

3. **ปรับแต่งการค้นหา**:
   - **Max Sources**: จำนวนโน๊ตสูงสุดที่จะค้นหา
   - **Min Confidence**: ระดับความเชื่อมั่นขั้นต่ำ

### การใช้งาน Context

```
👤 User: อ้างอิงจากโน๊ต "Marketing Strategy" ช่วยสร้างแผนการตลาดสำหรับสินค้าใหม่

🤖 AI: จากโน๊ต Marketing Strategy ของคุณ ฉันเห็นว่าคุณเน้น:
1. การวิเคราะห์กลุ่มเป้าหมาย
2. การใช้ social media marketing
3. การวัดผล ROI

สำหรับสินค้าใหม่ ฉันแนะนำแผนดังนี้...
```

## 🔗 Platform Integration

### Notion Integration

#### การตั้งค่า Notion

1. **สร้าง Integration**:
   - ไปที่ [Notion Developers](https://developers.notion.com)
   - สร้าง new integration
   - คัดลอก Integration Token

2. **ตั้งค่าใน Plugin**:
   - ใส่ Notion Integration Token ใน settings
   - เลือก databases ที่ต้องการซิงค์

#### การซิงค์ข้อมูล

```
👤 User: /sync-notion

🤖 AI: กำลังซิงค์ข้อมูลจาก Notion...

✅ ซิงค์สำเร็จ:
- Database: "Project Tasks" (15 pages)
- Database: "Meeting Notes" (8 pages)
- Database: "Ideas" (23 pages)

ข้อมูลถูกนำเข้าเป็นโน๊ตใน Obsidian แล้ว
```

### Airtable Integration

#### การตั้งค่า Airtable

1. **สร้าง Personal Access Token**:
   - ไปที่ Airtable Account Settings
   - สร้าง Personal Access Token
   - ตั้งค่า permissions ที่จำเป็น

2. **ตั้งค่าใน Plugin**:
   - ใส่ Airtable Access Token
   - ระบุ Base ID และ Table names

#### การใช้งาน

```
👤 User: แสดงข้อมูลจาก Airtable table "Customers"

🤖 AI: ข้อมูลจาก Customers table:

📊 **สรุป**:
- ลูกค้าทั้งหมด: 156 คน
- ลูกค้าใหม่เดือนนี้: 23 คน
- ลูกค้า VIP: 12 คน

📈 **Insights**:
- การเติบโตเดือนนี้: +18%
- ภูมิภาคที่มีลูกค้ามากที่สุด: กรุงเทพฯ
```

## ⚡ Advanced Features

### Custom Tools

#### การสร้าง Custom Tool

```javascript
// ตัวอย่าง Custom Tool
{
  "id": "word-counter",
  "name": "Word Counter",
  "description": "นับจำนวนคำในข้อความ",
  "parameters": {
    "text": {
      "type": "string",
      "description": "ข้อความที่ต้องการนับ"
    }
  }
}
```

#### การใช้งาน

```
👤 User: /tool word-counter "สวัสดีครับ ยินดีที่ได้รู้จัก"

🤖 AI: 📊 **Word Counter Results**:
- จำนวนคำ: 4 คำ
- จำนวนตัวอักษร: 23 ตัว
- จำนวนตัวอักษร (ไม่รวมช่องว่าง): 19 ตัว
```

### Templater Integration

#### การใช้งานร่วมกับ Templater

```javascript
// Template สำหรับ AI Summary
<%*
const aiSummary = await app.plugins.plugins['obsidian-ai-enhanced']
  .generateSummary(tp.file.content);
-%>

# AI Summary
<%= aiSummary %>

# Original Content
<%= tp.file.content %>
```

### Prompt Generator

#### การสร้าง Prompt อัตโนมัติ

```
👤 User: /generate-prompt "สร้างบทความเกี่ยวกับ AI"

🤖 AI: 📝 **Generated Prompt**:

"เขียนบทความเกี่ยวกับ Artificial Intelligence โดยครอบคลุมหัวข้อต่อไปนี้:

1. ความหมายและประวัติของ AI
2. ประเภทของ AI (Narrow AI, General AI, Super AI)
3. การประยุกต์ใช้ในปัจจุบัน
4. ผลกระทบต่อสังคมและเศรษฐกิจ
5. แนวโน้มในอนาคต

บทความควรมีความยาวประมาณ 1,500 คำ เขียนในรูปแบบที่เข้าใจง่าย เหมาะสำหรับผู้อ่านทั่วไป"

ต้องการให้ฉันใช้ prompt นี้สร้างบทความเลยหรือไม่?
```

### Macro Commands

#### การสร้าง Macro

```
👤 User: /create-macro "daily-summary"

🤖 AI: สร้าง macro "daily-summary" สำเร็จ

Macro จะทำงานดังนี้:
1. ค้นหาโน๊ตที่แก้ไขวันนี้
2. สร้างสรุปเนื้อหา
3. สร้างไฟล์ "Daily Summary YYYY-MM-DD"
4. แนบ tags ที่เกี่ยวข้อง
```

#### การใช้งาน Macro

```
👤 User: /macro daily-summary

🤖 AI: 📋 **Daily Summary - 2024-08-06**

**โน๊ตที่แก้ไขวันนี้**:
- Project Planning.md (แก้ไข 3 ครั้ง)
- Meeting Notes.md (สร้างใหม่)
- Ideas.md (เพิ่มเนื้อหา)

**สรุปกิจกรรม**:
- วางแผนโปรเจกต์ใหม่
- ประชุมทีม
- บันทึกไอเดียใหม่ 5 ข้อ

**Tags ที่ใช้บ่อย**: #project #meeting #ideas
```

## ⚙️ Settings & Configuration

### General Settings

#### Backend Connection
- **Backend URL**: URL ของ backend service
- **Connection Timeout**: เวลา timeout สำหรับการเชื่อมต่อ
- **Retry Attempts**: จำนวนครั้งที่จะลองใหม่เมื่อเกิดข้อผิดพลาด

#### AI Models
- **Default Model**: โมเดลเริ่มต้น
- **Available Models**: รายการโมเดลที่สามารถใช้ได้
- **Max Tokens**: จำนวน token สูงสุดต่อการตอบสนอง
- **Temperature**: ระดับความคิดสร้างสรรค์ (0.0-1.0)

### RAG Settings

#### Embedding Configuration
- **Embedding Model**: โมเดลสำหรับสร้าง embeddings
- **Max Sources**: จำนวนโน๊ตสูงสุดที่จะใช้เป็น context
- **Min Confidence**: ระดับความเชื่อมั่นขั้นต่ำ

#### Processing Options
- **Auto Process**: ประมวลผลโน๊ตใหม่อัตโนมัติ
- **Include Attachments**: รวมไฟล์แนบในการประมวลผล
- **Exclude Folders**: โฟลเดอร์ที่ไม่ต้องการประมวลผล

### Integration Settings

#### Notion
- **Integration Token**: Token สำหรับเชื่อมต่อ Notion
- **Auto Sync**: ซิงค์อัตโนมัติ
- **Sync Interval**: ช่วงเวลาการซิงค์

#### Airtable
- **Access Token**: Token สำหรับเชื่อมต่อ Airtable
- **Base ID**: ID ของ Airtable base
- **Table Names**: ชื่อ tables ที่ต้องการซิงค์

### UI Settings

#### Appearance
- **Dark Mode**: ใช้ธีมมืด
- **Font Size**: ขนาดตัวอักษร
- **Show Sidebar**: แสดง AI chat ใน sidebar

#### Behavior
- **Streaming**: เปิดใช้งาน streaming responses
- **Auto Save**: บันทึกการสนทนาอัตโนมัติ
- **Notification**: แจ้งเตือนเมื่อมีการอัปเดต

## 💡 Tips & Best Practices

### การเขียน Prompt ที่ดี

#### 1. ระบุบริบทชัดเจน
```
❌ ไม่ดี: "เขียนบทความ"
✅ ดี: "เขียนบทความเกี่ยวกับ machine learning สำหรับผู้เริ่มต้น ความยาว 1000 คำ"
```

#### 2. ใช้ตัวอย่าง
```
👤 User: สร้างรายการ todo ในรูปแบบนี้:
- [ ] งานที่ต้องทำ (deadline: วันที่)
- [ ] งานอื่น (priority: สูง/กลาง/ต่ำ)

สำหรับโปรเจกต์ website ใหม่
```

#### 3. ระบุรูปแบบผลลัพธ์
```
👤 User: วิเคราะห์ข้อมูลการขายและแสดงผลในรูปแบบ:
1. สรุปภาพรวม
2. แนวโน้ม
3. ข้อเสนอแนะ
```

### การใช้งาน RAG อย่างมีประสิทธิภาพ

#### 1. จัดระเบียบโน๊ต
- ใช้ tags อย่างสม่ำเสมอ
- ตั้งชื่อไฟล์ที่มีความหมาย
- เขียนเนื้อหาที่ชัดเจนและครบถ้วน

#### 2. ปรับแต่งการค้นหา
- เพิ่ม Max Sources สำหรับหัวข้อที่ซับซ้อน
- ลด Min Confidence หากต้องการผลลัพธ์มากขึ้น
- ใช้ keywords ที่เฉพาะเจาะจง

#### 3. ตรวจสอบ Sources
- ดูว่า AI อ้างอิงโน๊ตไหนบ้าง
- ตรวจสอบความถูกต้องของข้อมูล
- อัปเดตโน๊ตเมื่อมีข้อมูลใหม่

### การจัดการ API Usage

#### 1. เลือกโมเดลที่เหมาะสม
- ใช้ GPT-3.5 สำหรับงานทั่วไป
- ใช้ GPT-4 สำหรับงานที่ซับซ้อน
- ใช้ Claude สำหรับการวิเคราะห์เอกสารยาว

#### 2. ปรับแต่ง Parameters
- ลด Max Tokens สำหรับคำตอบสั้น
- ปรับ Temperature ตามประเภทงาน
- ใช้ Streaming เพื่อประหยัด tokens

#### 3. ใช้ Cache
- เปิดใช้งาน caching
- หลีกเลี่ยงการถามคำถามซ้ำ
- ใช้ saved prompts สำหรับงานประจำ

### การแก้ไขปัญหาเบื้องต้น

#### 1. AI ตอบไม่ตรงคำถาม
- ปรับปรุงการเขียน prompt
- เพิ่มบริบทที่ชัดเจน
- ตรวจสอบการตั้งค่า RAG

#### 2. การค้นหาไม่แม่นยำ
- อัปเดต embeddings
- ปรับ confidence threshold
- ตรวจสอบ tags และ keywords

#### 3. ประสิทธิภาพช้า
- ลดจำนวน sources
- ใช้โมเดล embedding ที่เบากว่า
- ตรวจสอบการเชื่อมต่อ backend

---

**หมายเหตุ**: คู่มือนี้จะได้รับการอัปเดตเป็นระยะ ติดตามข่าวสารใหม่ได้ที่ GitHub repository

