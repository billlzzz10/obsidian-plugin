# ObsidianMind Pro - MCP Services Integration Guide

## 🔌 **ภาพรวม MCP Services**

ObsidianMind Pro รองรับการเชื่อมต่อกับ **Model Context Protocol (MCP) Services** เพื่อขยายความสามารถของ AI plugin:

### 📋 **Services ที่รองรับ:**

## 1. 📝 **Notion MCP**
**ความสามารถ:**
- อ่าน/เขียน Notion pages และ databases
- ค้นหาข้อมูลใน Notion workspace
- สร้าง/แก้ไข/ลบ pages และ blocks
- จัดการ properties และ relations

**การใช้งาน:**
- เชื่อมต่อ Obsidian กับ Notion workspace
- ให้ AI ช่วยจัดการข้อมูลใน Notion
- Sync ข้อมูลระหว่าง Obsidian และ Notion
- สร้าง automated workflows

**ตัวอย่างคำสั่ง:**
```
"สร้าง page ใหม่ใน Notion ชื่อ 'Meeting Notes' และเพิ่มข้อมูลจากโน้ตนี้"
"ค้นหา tasks ใน Notion database ที่ยังไม่เสร็จ"
"อัปเดต status ของ project XYZ ใน Notion เป็น 'In Progress'"
```

## 2. ⚡ **Zapier MCP**
**ความสามารถ:**
- เชื่อมต่อกับ 5000+ apps ผ่าน Zapier
- สร้าง automation workflows
- Trigger actions ในแอปต่างๆ
- รับ webhooks และ notifications

**การใช้งาน:**
- เชื่อมต่อ Obsidian กับแอปที่ใช้งานประจำ
- ส่งข้อมูลจาก Obsidian ไปยังแอปอื่นๆ
- รับข้อมูลจากแอปภายนอกมาใน Obsidian
- สร้าง automated workflows

**ตัวอย่างการเชื่อมต่อ:**
- **Email**: ส่งโน้ตผ่าน Gmail/Outlook
- **Calendar**: เพิ่ม events ใน Google Calendar
- **CRM**: อัปเดตข้อมูลลูกค้าใน Salesforce
- **Social**: โพสต์ไปยัง Twitter/LinkedIn
- **Storage**: บันทึกไฟล์ใน Google Drive/Dropbox
- **Communication**: ส่งข้อความผ่าน Slack/Discord

**ตัวอย่างคำสั่ง:**
```
"ส่งโน้ตนี้ไปยัง Slack channel #team-updates"
"เพิ่ม meeting นี้ใน Google Calendar วันพรุ่งนี้ 10:00"
"บันทึกรายงานนี้ไปยัง Google Drive folder 'Reports'"
```

## 3. 🎨 **Figma MCP**
**ความสามารถ:**
- อ่านข้อมูล Figma files และ projects
- ดึง design specs และ assets
- เข้าถึง comments และ feedback
- จัดการ design systems

**การใช้งาน:**
- นำข้อมูล design มาใช้ในโน้ต
- สร้างเอกสาร design requirements
- ติดตาม design feedback และ changes
- จัดการ design assets และ specs

**ตัวอย่างคำสั่ง:**
```
"ดึงข้อมูล design specs จาก Figma file 'Mobile App UI'"
"สร้างรายงาน design changes จาก project ล่าสุด"
"แสดง comments และ feedback จาก design review"
```

## ⚙️ **การติดตั้งและตั้งค่า**

### 🔧 **ขั้นตอนการติดตั้ง:**

#### 1. **เปิดใช้งาน MCP Services**
```
1. ไปที่ Settings → ObsidianMind Pro
2. เลื่อนไปที่ "Advanced Features"
3. เปิด "MCP Enabled"
4. เลือก services ที่ต้องการใช้งาน
```

#### 2. **ตั้งค่า Notion MCP**
```bash
# ติดตั้ง Notion MCP Server
npm install -g @notionhq/notion-mcp-server

# ตั้งค่า environment variable
export NOTION_TOKEN="your-notion-integration-token"
```

**ขั้นตอนใน Notion:**
1. ไปที่ [Notion Developers](https://developers.notion.com)
2. สร้าง Integration ใหม่
3. คัดลอก "Internal Integration Token"
4. Share databases/pages ที่ต้องการกับ Integration

#### 3. **ตั้งค่า Zapier MCP**
```
1. ไปที่ Zapier Dashboard
2. สร้าง API key
3. ตั้งค่าใน ObsidianMind Pro Settings
4. ทดสอบการเชื่อมต่อ
```

#### 4. **ตั้งค่า Figma MCP**
```
1. รัน Figma MCP Server local:
   git clone figma-mcp-server
   npm install && npm start
   
2. Server จะรันที่ http://127.0.0.1:3845
3. ตั้งค่า Figma API token
```

## 🚀 **การใช้งาน**

### 💬 **ใน Chat Interface:**
```
User: "สร้าง task ใหม่ใน Notion database 'Projects'"
AI: "ฉันจะสร้าง task ใหม่ให้คุณ ชื่ออะไรดี?"

User: "ส่งโน้ตนี้ไปยัง Slack"
AI: "ส่งไปยัง channel ไหนครับ?"

User: "ดึง design specs จาก Figma"
AI: "ต้องการข้อมูลจาก file ไหนครับ?"
```

### ⚡ **Auto Actions:**
- บันทึกโน้ตสำคัญไปยัง Notion อัตโนมัติ
- ส่ง daily summary ผ่าน Slack
- สร้าง calendar events จาก meeting notes
- อัปเดต project status ใน external tools

## 🔒 **ความปลอดภัย**

- **API Keys**: เข้ารหัสและเก็บใน local storage
- **Permissions**: ควบคุมการเข้าถึงแต่ละ service
- **Rate Limiting**: จำกัดจำนวน requests
- **Audit Log**: บันทึกการใช้งาน services

## 🐛 **Troubleshooting**

### ❌ **ปัญหาทั่วไป:**

**Connection Failed:**
```
1. ตรวจสอบ API keys
2. ตรวจสอบ network connection
3. ดู service status
4. ตรวจสอบ rate limits
```

**Service Not Responding:**
```
1. Restart MCP service
2. ตรวจสอบ service logs
3. ทดสอบ endpoint manually
4. อัปเดต service version
```

**Permission Errors:**
```
1. ตรวจสอบ API permissions
2. Re-authorize integrations
3. ตรวจสอบ workspace access
4. อัปเดต integration settings
```

## 📈 **Performance Tips**

- **Batch Operations**: รวม requests หลายๆ อัน
- **Caching**: เก็บ cache ข้อมูลที่ใช้บ่อย
- **Background Sync**: ใช้ background sync สำหรับข้อมูลขนาดใหญ่
- **Selective Sync**: เลือก sync เฉพาะข้อมูลที่จำเป็น

---

## 🎉 **ผลลัพธ์ที่ได้**

เมื่อตั้งค่าเสร็จ คุณจะได้:

✅ **Unified Workspace** - ใช้งาน Obsidian เป็น hub กลางสำหรับทุกแอป  
✅ **AI-Powered Automation** - ให้ AI ช่วยจัดการงานข้าม platforms  
✅ **Seamless Integration** - ข้อมูลไหลระหว่างแอปได้อย่างราบรื่น  
✅ **Productivity Boost** - ลดงาน manual และเพิ่มประสิทธิภาพ  

🚀 **พร้อมสำหรับการใช้งานระดับ Professional!**
