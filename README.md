# Obsidian Plugin Development Repository

Repository สำหรับการพัฒนา Plugin Obsidian ที่มีการรวม AI, RAG และการประมวลผลข้อมูลขั้นสูง

## 🚀 Overview / ภาพรวม

This repository contains an advanced Obsidian plugin that integrates AI capabilities, Retrieval-Augmented Generation (RAG), and multi-source data ingestion. The plugin enables intelligent conversations with your knowledge base by connecting Obsidian notes with external data sources like Notion and Airtable.

Repository นี้ประกอบด้วย Plugin Obsidian ที่ขั้นสูงซึ่งรวม AI, RAG และการนำเข้าข้อมูลจากหลายแหล่ง Plugin นี้ช่วยให้คุณสนทนาอย่างชาญฉลาดกับฐานความรู้ของคุณโดยการเชื่อมต่อ Obsidian notes กับแหล่งข้อมูลภายนอกเช่น Notion และ Airtable

## 📋 Features / คุณสมบัติ

### Core Features / คุณสมบัติหลัก
- **🤖 AI Chat Integration** - สนทนากับ AI ที่เข้าใจเนื้อหาใน vault ของคุณ
- **🔍 RAG (Retrieval-Augmented Generation)** - ค้นหาและใช้ข้อมูลจาก notes เพื่อตอบคำถาม
- **📊 Multi-Source Data Ingestion** - เชื่อมต่อกับ Notion และ Airtable
- **🧠 Local Embedding Processing** - ประมวลผล embeddings บนเครื่องเพื่อความเป็นส่วนตัว
- **⚡ Real-time Vector Search** - ค้นหาข้อมูลที่เกี่ยวข้องอย่างรวดเร็ว

### Advanced Features / คุณสมบัติขั้นสูง
- **🔧 Custom Tools & Macros** - สร้างเครื่องมือและมาโครส่วนตัว
- **📝 Templater Integration** - รวมกับ Templater plugin
- **🌐 MCP (Model Context Protocol) Support** - รองรับ MCP services
- **🔄 Auto-sync** - ซิงค์ข้อมูลอัตโนมัติจากแหล่งภายนอก
- **🎯 Prompt Templates** - เทมเพลตพร้อมท์ที่กำหนดได้

## 🏗️ Project Structure / โครงสร้างโปรเจค

```
obsidian-plugin/
├── ObsidianMind Pro/           # Main plugin directory
│   ├── src/                    # Source code
│   │   ├── main.ts            # Plugin entry point
│   │   ├── settings.ts        # Plugin settings
│   │   ├── modules/           # Core modules
│   │   │   ├── ai-models/     # AI model management
│   │   │   ├── chat/          # Chat functionality
│   │   │   ├── embedding/     # Embedding processing
│   │   │   ├── rag/           # RAG implementation
│   │   │   ├── data-ingestion/ # External data sources
│   │   │   ├── advanced-features/ # Advanced features
│   │   │   └── utils/         # Utility functions
│   │   └── ui/                # User interface components
│   ├── tests/                 # Test files
│   ├── package.json           # Dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── esbuild.config.mjs     # Build configuration
│   └── manifest.json          # Plugin manifest
└── README.md                  # This file
```

## 🛠️ Development Setup / การติดตั้งสำหรับพัฒนา

### Prerequisites / ข้อกำหนดเบื้องต้น
- Node.js (v18 or higher)
- npm or yarn
- TypeScript knowledge
- Obsidian app installed

### Installation / การติดตั้ง

1. **Clone the repository / โคลน repository**
   ```bash
   git clone https://github.com/billlzzz10/obsidian-plugin.git
   cd obsidian-plugin
   ```

2. **Navigate to plugin directory / เข้าสู่โฟลเดอร์ plugin**
   ```bash
   cd "ObsidianMind Pro"
   ```

3. **Install dependencies / ติดตั้ง dependencies**
   ```bash
   npm install
   ```

4. **Build the plugin / สร้าง plugin**
   ```bash
   npm run build
   ```

5. **Development mode / โหมดพัฒนา**
   ```bash
   npm run dev
   ```

### Setting up for Development / การตั้งค่าสำหรับการพัฒนา

1. **Create a symbolic link to your Obsidian vault**
   ```bash
   # Windows
   mklink /D "C:\path\to\your\vault\.obsidian\plugins\obsidian-ai-plugin" "C:\path\to\this\repo\ObsidianMind Pro"
   
   # macOS/Linux
   ln -s "/path/to/this/repo/ObsidianMind Pro" "/path/to/your/vault/.obsidian/plugins/obsidian-ai-plugin"
   ```

2. **Enable the plugin in Obsidian**
   - Open Obsidian Settings
   - Go to Community Plugins
   - Enable "Obsidian AI with RAG & Embedding"

## 🧪 Testing / การทดสอบ

```bash
# Run tests / รันการทดสอบ
npm test

# Run linting / รัน linting
npm run lint

# Format code / จัดรูปแบบโค้ด
npm run format
```

## 📦 Building for Production / การสร้างสำหรับการใช้งานจริง

```bash
# Build optimized version / สร้างเวอร์ชันที่เพิ่มประสิทธิภาพ
npm run build

# Create release package / สร้างแพ็กเกจสำหรับเผยแพร่
npm run release
```

## ⚙️ Configuration / การกำหนดค่า

### API Keys / คีย์ API
The plugin supports multiple AI providers:
- **OpenAI** - GPT models
- **Anthropic** - Claude models  
- **Google** - Gemini models
- **Azure** - Azure OpenAI Service

### External Integrations / การเชื่อมต่อภายนอก
- **Notion API** - For database integration
- **Airtable API** - For spreadsheet data
- **Azure Translator** - For translation services

## 🤝 Contributing / การมีส่วนร่วม

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow / ขั้นตอนการพัฒนา

1. **Fork the repository / Fork repository**
2. **Create a feature branch / สร้าง feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes / ทำการเปลี่ยนแปลง**
4. **Test your changes / ทดสอบการเปลี่ยนแปลง**
   ```bash
   npm test
   npm run lint
   ```
5. **Commit your changes / คอมมิตการเปลี่ยนแปลง**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch / พุชไปยัง branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request / เปิด Pull Request**

## 🐛 Bug Reports / การรายงานบัก

Please use the [GitHub Issues](https://github.com/billlzzz10/obsidian-plugin/issues) to report bugs. Include:
- Description of the problem / คำอธิบายปัญหา
- Steps to reproduce / ขั้นตอนการทำซ้ำ
- Expected behavior / พฤติกรรมที่คาดหวัง
- Actual behavior / พฤติกรรมที่เกิดขึ้นจริง
- Screenshots (if applicable) / ภาพหน้าจอ (ถ้ามี)

## 📚 Documentation / เอกสาร

- [User Manual (English)](ObsidianMind%20Pro/USER_MANUAL.md)
- [คู่มือผู้ใช้ (ภาษาไทย)](ObsidianMind%20Pro/USER_MANUAL.th.md)
- [Installation Guide](ObsidianMind%20Pro/INSTALLATION.md)
- [คู่มือการติดตั้ง](ObsidianMind%20Pro/INSTALLATION.th.md)
- [Examples](ObsidianMind%20Pro/EXAMPLES.md)
- [ตัวอย่าง](ObsidianMind%20Pro/EXAMPLES.th.md)
- [Azure Integration Guide](ObsidianMind%20Pro/AZURE_INTEGRATION_GUIDE.md)
- [MCP Services Guide](ObsidianMind%20Pro/MCP_SERVICES_GUIDE.md)

## 🔧 Troubleshooting / การแก้ไขปัญหา

### Common Issues / ปัญหาที่พบบ่อย

1. **Build failures / การสร้างล้มเหลว**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Plugin not loading / Plugin ไม่โหลด**
   - Check Obsidian console for errors
   - Ensure manifest.json is valid
   - Verify plugin is enabled in settings

3. **API errors / ข้อผิดพลาด API**
   - Verify API keys are correct
   - Check network connectivity
   - Review rate limits

## 📄 License / ใบอนุญาต

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

โปรเจคนี้อยู่ภายใต้ใบอนุญาต MIT - ดูรายละเอียดในไฟล์ [LICENSE](LICENSE)

## 🙏 Acknowledgments / กิตติกรรมประกาศ

- Obsidian team for the excellent platform
- Open source AI/ML community
- Contributors and users of this plugin

## 📞 Support / การสนับสนุน

- 📧 Email: [support@example.com](mailto:support@example.com)
- 💬 Discord: [Join our server](https://discord.gg/example)
- 📱 GitHub Discussions: [Community discussions](https://github.com/billlzzz10/obsidian-plugin/discussions)

---

**Made with ❤️ for the Obsidian community / สร้างด้วย ❤️ สำหรับชุมชน Obsidian**