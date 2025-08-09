# เครื่องมือแปลภาษาสำหรับ ObsidianMind Pro

เครื่องมือนี้ช่วยในการแปลเอกสาร Markdown จากภาษาอังกฤษเป็นภาษาไทย (และภาษาอื่นๆ ในอนาคต) โดยใช้ Azure AI Translation Service หรือ OpenAI API

## ไฟล์หลัก

- `translate_markdown.py` - สคริปต์แปลภาษาพื้นฐาน
- `enhanced_translate_markdown.py` - สคริปต์แปลภาษาที่มีการปรับแต่งสำหรับเนื้อหาทางเทคนิค
- `setup_and_run_translation.py` - สคริปต์สำหรับติดตั้งและรันการแปลภาษาอัตโนมัติ
- `run_translation.bat` - ไฟล์ batch สำหรับรันการแปลภาษาบน Windows
- `run_enhanced_translation.bat` - ไฟล์ batch สำหรับรันการแปลภาษาที่มีการปรับแต่งบน Windows

## การตั้งค่า

### 1. ติดตั้ง Python Dependencies

```bash
pip install openai azure-ai-translation-text python-dotenv
```

### 2. สร้างไฟล์ .env

สร้างไฟล์ `.env` ในโฟลเดอร์เดียวกับสคริปต์ และเพิ่ม API key:

```
# สำหรับ Azure Translation Service
AZURE_TRANSLATOR_KEY=your_azure_translator_key
AZURE_TRANSLATOR_REGION=eastus

# สำหรับ OpenAI API (ถ้าต้องการใช้)
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1  # หรือ Azure OpenAI endpoint

# เลือก Translation Service (azure หรือ openai)
TRANSLATION_SERVICE=azure
```

## วิธีใช้งาน

### การแปลไฟล์เดียว

```bash
python translate_markdown.py --input path/to/input.md --output path/to/output.th.md --source en --target th
```

### การแปลไฟล์หลายไฟล์พร้อมกัน

```bash
python enhanced_translate_markdown.py --input-dir path/to/input/folder --output-dir path/to/output/folder --source en --target th
```

### การใช้ไฟล์ Batch บน Windows

เพียงแค่ดับเบิลคลิกที่ `run_translation.bat` หรือ `run_enhanced_translation.bat` และทำตามคำแนะนำ

### การแปลแบบอัตโนมัติ

```bash
python setup_and_run_translation.py
```

สคริปต์นี้จะนำคุณผ่านกระบวนการตั้งค่าและรันการแปลโดยอัตโนมัติ

## คำแนะนำในการแปล

1. สำหรับเอกสารทางเทคนิค แนะนำให้ใช้ `enhanced_translate_markdown.py` เพื่อให้ได้ผลลัพธ์ที่ดีกว่า
2. คำศัพท์เฉพาะทางเทคนิคจะไม่ถูกแปล เช่น `API`, `Obsidian`, `Plugin` เป็นต้น
3. โค้ดใน code block จะไม่ถูกแปล แต่ความคิดเห็นในโค้ดจะถูกแปล
4. สำหรับเอกสารยาวๆ ให้แบ่งเป็นส่วนๆ เพื่อประสิทธิภาพที่ดีขึ้น

## การตั้งค่า Azure Translation Service

1. ไปที่ [Azure Portal](https://portal.azure.com)
2. สร้าง Translator resource ใหม่
3. เลือก tier ที่เหมาะสม (ฟรีก็เพียงพอสำหรับการใช้งานทั่วไป)
4. หลังจากสร้างเสร็จ ไปที่ "Keys and Endpoint" เพื่อคัดลอก API key และ region

## การใช้งานกับ GitHub Actions

คุณสามารถใช้ GitHub Actions เพื่อทำการแปลภาษาอัตโนมัติเมื่อมีการอัปเดตเอกสารต้นฉบับ:

```yaml
name: Translate Documentation

on:
  push:
    branches: [ main ]
    paths:
      - '**.md'
  workflow_dispatch:

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.10'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install openai azure-ai-translation-text python-dotenv
    
    - name: Run translation
      env:
        AZURE_TRANSLATOR_KEY: ${{ secrets.AZURE_TRANSLATOR_KEY }}
        AZURE_TRANSLATOR_REGION: eastus
        TRANSLATION_SERVICE: azure
      run: |
        python enhanced_translate_markdown.py --input-dir docs --output-dir docs --source en --target th
    
    - name: Commit changes
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add .
        git commit -m "Automatically translate documentation" || echo "No changes to commit"
        git push
```

## การแก้ไขปัญหา

1. **การแปลไม่สมบูรณ์**: ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและ API key
2. **ข้อผิดพลาดในการแปลงรูปแบบ Markdown**: อัปเดตสคริปต์หรือใช้ `enhanced_translate_markdown.py` แทน
3. **การแปลไม่ถูกต้อง**: พิจารณาเปลี่ยนจาก Azure Translator เป็น OpenAI API สำหรับคุณภาพการแปลที่ดีขึ้น
