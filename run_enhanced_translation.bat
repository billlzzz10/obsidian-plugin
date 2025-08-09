@echo off
setlocal enabledelayedexpansion

echo ==============================================
echo ObsidianMind Pro - Enhanced Translation Tool
echo ==============================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8 or higher.
    echo.
    pause
    exit /b 1
)

REM Check if required packages are installed
echo Checking required packages...
python -c "import openai" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing OpenAI package...
    pip install openai
)

python -c "import azure.ai.translation.text" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing Azure AI Translation Text package...
    pip install azure-ai-translation-text
)

python -c "import dotenv" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing python-dotenv package...
    pip install python-dotenv
)

echo All required packages are installed.
echo.

REM Check if .env file exists
if not exist "obsidian-n-a\.env" (
    echo .env file not found. Creating template...
    echo # สำหรับ Azure Translation Service> obsidian-n-a\.env
    echo AZURE_TRANSLATOR_KEY=>> obsidian-n-a\.env
    echo AZURE_TRANSLATOR_REGION=eastus>> obsidian-n-a\.env
    echo.>> obsidian-n-a\.env
    echo # สำหรับ OpenAI API>> obsidian-n-a\.env
    echo OPENAI_API_KEY=>> obsidian-n-a\.env
    echo.>> obsidian-n-a\.env
    echo # เลือก Translation Service (azure หรือ openai)>> obsidian-n-a\.env
    echo TRANSLATION_SERVICE=azure>> obsidian-n-a\.env
    
    echo Please edit obsidian-n-a\.env file to add your API keys.
    echo.
    notepad obsidian-n-a\.env
    echo.
    echo After adding your API keys, please run this script again.
    pause
    exit /b 0
)

REM Run translation
:menu
cls
echo ==============================================
echo ObsidianMind Pro - Enhanced Translation Tool
echo ==============================================
echo.
echo เลือกรูปแบบการแปล:
echo 1. แปลไฟล์เดียว
echo 2. แปลทั้งโฟลเดอร์
echo 3. แปลเอกสารตัวอย่าง (ทั้งหมด)
echo 4. ออกจากโปรแกรม
echo.
set /p choice="เลือกตัวเลือก (1-4): "

if "%choice%"=="1" goto single_file
if "%choice%"=="2" goto folder
if "%choice%"=="3" goto examples
if "%choice%"=="4" goto end

echo ตัวเลือกไม่ถูกต้อง กรุณาลองอีกครั้ง
timeout /t 2 >nul
goto menu

:single_file
cls
echo ==============================================
echo        แปลไฟล์เดียว
echo ==============================================
echo.
set /p input_file="ระบุพาธของไฟล์ที่ต้องการแปล: "
set /p output_file="ระบุพาธของไฟล์ผลลัพธ์: "
set /p source_lang="ภาษาต้นฉบับ [en]: "
if "!source_lang!"=="" set source_lang=en
set /p target_lang="ภาษาที่ต้องการแปลเป็น [th]: "
if "!target_lang!"=="" set target_lang=th

echo.
echo กำลังแปล !input_file! เป็น !output_file!...
echo.

python obsidian-n-a\enhanced_translate_markdown.py --input "!input_file!" --output "!output_file!" --source !source_lang! --target !target_lang!

echo.
echo แปลเสร็จสิ้น
pause
goto menu

:folder
cls
echo ==============================================
echo        แปลทั้งโฟลเดอร์
echo ==============================================
echo.
set /p input_dir="ระบุพาธของโฟลเดอร์ที่ต้องการแปล: "
set /p output_dir="ระบุพาธของโฟลเดอร์สำหรับผลลัพธ์: "
set /p source_lang="ภาษาต้นฉบับ [en]: "
if "!source_lang!"=="" set source_lang=en
set /p target_lang="ภาษาที่ต้องการแปลเป็น [th]: "
if "!target_lang!"=="" set target_lang=th

echo.
echo กำลังแปลไฟล์ทั้งหมดจาก !input_dir! ไปยัง !output_dir!...
echo.

python obsidian-n-a\enhanced_translate_markdown.py --input-dir "!input_dir!" --output-dir "!output_dir!" --source !source_lang! --target !target_lang!

echo.
echo แปลเสร็จสิ้น
pause
goto menu

:examples
cls
echo ==============================================
echo        แปลเอกสารตัวอย่าง
echo ==============================================
echo.
echo กำลังแปลเอกสารตัวอย่างทั้งหมด...
echo.

REM แปลเอกสารหลัก
python obsidian-n-a\enhanced_translate_markdown.py --input "ObsidianMind Pro\README.md" --output "ObsidianMind Pro\README.th.md" --source en --target th
python obsidian-n-a\enhanced_translate_markdown.py --input "ObsidianMind Pro\INSTALLATION.md" --output "ObsidianMind Pro\INSTALLATION.th.md" --source en --target th
python obsidian-n-a\enhanced_translate_markdown.py --input "ObsidianMind Pro\USER_MANUAL.md" --output "ObsidianMind Pro\USER_MANUAL.th.md" --source en --target th
python obsidian-n-a\enhanced_translate_markdown.py --input "ObsidianMind Pro\EXAMPLES.md" --output "ObsidianMind Pro\EXAMPLES.th.md" --source en --target th
python obsidian-n-a\enhanced_translate_markdown.py --input "ObsidianMind Pro\AZURE_INTEGRATION_GUIDE.md" --output "ObsidianMind Pro\AZURE_INTEGRATION_GUIDE.th.md" --source en --target th

echo.
echo แปลเสร็จสิ้น
pause
goto menu

:end
echo.
echo ขอบคุณที่ใช้ ObsidianMind Pro Translation Tool
echo.
pause
