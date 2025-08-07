# Contributing to Obsidian AI Plugin / การมีส่วนร่วมใน Obsidian AI Plugin

Thank you for your interest in contributing! / ขอบคุณที่สนใจมีส่วนร่วม!

## 🚀 Quick Start / เริ่มต้นอย่างรวดเร็ว

1. **Fork the repository / Fork repository**
2. **Clone your fork / โคลน fork ของคุณ**
   ```bash
   git clone https://github.com/your-username/obsidian-plugin.git
   ```
3. **Install dependencies / ติดตั้ง dependencies**
   ```bash
   cd "ObsidianMind Pro"
   npm install
   ```
4. **Create a branch / สร้าง branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Guidelines / แนวทางการพัฒนา

### Code Standards / มาตรฐานโค้ด

- **TypeScript** - Use strict TypeScript with proper types
- **ESLint** - Follow the existing ESLint configuration
- **Prettier** - Code formatting is handled automatically
- **Comments** - Write clear comments in English or Thai

### File Organization / การจัดระเบียบไฟล์

```
src/
├── modules/              # Core functionality modules
│   ├── ai-models/       # AI model management
│   ├── chat/            # Chat functionality  
│   ├── embedding/       # Embedding processing
│   ├── rag/             # RAG implementation
│   ├── data-ingestion/  # External data sources
│   ├── advanced-features/ # Advanced features
│   └── utils/           # Utility functions
├── ui/                  # User interface components
├── main.ts             # Plugin entry point
└── settings.ts         # Plugin settings
```

### Testing / การทดสอบ

- Write unit tests for new functionality
- Ensure all tests pass before submitting
- Test with real Obsidian environment when possible

```bash
# Run tests / รันการทดสอบ
npm test

# Run specific test / รันการทดสอบเฉพาะ
npm test -- --testNamePattern="your test"
```

### Linting / การตรวจสอบโค้ด

```bash
# Run linter / รัน linter
npm run lint

# Fix auto-fixable issues / แก้ไขปัญหาอัตโนมัติ
npm run lint -- --fix

# Format code / จัดรูปแบบโค้ด
npm run format
```

## 🐛 Bug Reports / การรายงานบัก

When reporting bugs, please include:
เมื่อรายงานบัก กรุณาใส่ข้อมูล:

- **Description** - Clear description of the issue / คำอธิบายปัญหาอย่างชัดเจน
- **Steps to reproduce** - How to reproduce the bug / ขั้นตอนการทำซ้ำ
- **Expected behavior** - What should happen / สิ่งที่ควรเกิดขึ้น
- **Actual behavior** - What actually happens / สิ่งที่เกิดขึ้นจริง
- **Environment** - OS, Obsidian version, plugin version / ระบบปฏิบัติการ เวอร์ชัน Obsidian เวอร์ชัน plugin
- **Screenshots** - If applicable / ภาพหน้าจอถ้ามี

## ✨ Feature Requests / การขอฟีเจอร์ใหม่

When requesting features, please:
เมื่อขอฟีเจอร์ใหม่ กรุณา:

- **Use case** - Explain why this feature would be useful / อธิบายว่าฟีเจอร์นี้มีประโยชน์อย่างไร
- **Description** - Detailed description of the feature / คำอธิบายฟีเจอร์อย่างละเอียด
- **Mockups** - Visual mockups if applicable / ภาพจำลองถ้ามี
- **Implementation ideas** - Any thoughts on implementation / ความคิดเห็นเกี่ยวกับการพัฒนา

## 📝 Pull Request Process / ขั้นตอน Pull Request

1. **Update documentation** - Update relevant docs / อัปเดตเอกสารที่เกี่ยวข้อง
2. **Add tests** - Include tests for new functionality / เพิ่มการทดสอบสำหรับฟังก์ชันใหม่
3. **Follow conventions** - Match existing code style / ใช้รูปแบบโค้ดที่มีอยู่
4. **Update changelog** - Add entry to CHANGELOG.md / เพิ่มรายการใน CHANGELOG.md
5. **Write clear commit messages** - Use conventional commits / เขียนข้อความ commit ที่ชัดเจน

### Commit Message Format / รูปแบบข้อความ Commit

```
type(scope): description

Example:
feat(chat): add support for streaming responses
fix(rag): resolve embedding generation issue
docs(readme): update installation instructions
```

Types / ประเภท:
- `feat` - New feature / ฟีเจอร์ใหม่
- `fix` - Bug fix / แก้ไขบัก
- `docs` - Documentation / เอกสาร
- `style` - Code style changes / การเปลี่ยนแปลงรูปแบบโค้ด
- `refactor` - Code refactoring / การปรับปรุงโค้ด
- `test` - Adding tests / การเพิ่มการทดสอบ
- `chore` - Maintenance / การบำรุงรักษา

## 🏗️ Architecture Guidelines / แนวทางสถาปัตยกรรม

### Module Design / การออกแบบโมดูล

- **Single Responsibility** - Each module should have one clear purpose
- **Loose Coupling** - Minimize dependencies between modules
- **High Cohesion** - Related functionality should be grouped together
- **Clear Interfaces** - Define clear APIs between modules

### Error Handling / การจัดการข้อผิดพลาด

- Use custom error types defined in `types.ts`
- Always handle async operations properly
- Provide meaningful error messages
- Log errors appropriately

```typescript
try {
    await someAsyncOperation();
} catch (error) {
    console.error('Operation failed:', error);
    throw new PluginError(
        'Failed to complete operation',
        ERROR_CODES.OPERATION_FAILED
    );
}
```

### Performance Considerations / ข้อพิจารณาด้านประสิทธิภาพ

- **Lazy Loading** - Load resources only when needed
- **Caching** - Cache expensive operations
- **Batch Processing** - Process data in batches when possible
- **Memory Management** - Clean up resources properly

## 🌍 Internationalization / การรองรับหลายภาษา

- Support both English and Thai documentation
- Use clear, simple language
- Provide examples in both languages when applicable
- Consider cultural context in UI design

## 🧪 Testing Guidelines / แนวทางการทดสอบ

### Unit Tests / การทดสอบหน่วย
- Test individual functions and methods
- Mock external dependencies
- Use descriptive test names
- Cover edge cases

### Integration Tests / การทดสอบการผสานรวม
- Test module interactions
- Test with real Obsidian API when possible
- Test error scenarios

### Manual Testing / การทดสอบด้วยตนเอง
- Test in real Obsidian environment
- Test with different vault configurations
- Test performance with large datasets

## 📊 Performance Standards / มาตรฐานประสิทธิภาพ

- **Startup time** - Plugin should load quickly
- **Memory usage** - Keep memory footprint reasonable
- **Response time** - UI interactions should be responsive
- **Battery life** - Consider mobile device battery usage

## 🔒 Security Guidelines / แนวทางความปลอดภัย

- **API Keys** - Never commit API keys to version control
- **Input Validation** - Validate all user inputs
- **Data Privacy** - Respect user privacy and data protection
- **Secure Communications** - Use HTTPS for all external communications

## 📞 Getting Help / การขอความช่วยเหลือ

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and general discussion
- **Discord** - For real-time chat and community support
- **Email** - For private inquiries

## 🏆 Recognition / การยกย่อง

Contributors will be recognized in:
ผู้มีส่วนร่วมจะได้รับการยกย่องใน:

- CONTRIBUTORS.md file
- Release notes
- Plugin credits
- Community highlights

Thank you for contributing to make this plugin better! / ขอบคุณที่มีส่วนร่วมทำให้ plugin นี้ดีขึ้น!