#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Setup and Run Translation Script for ObsidianMind Pro
This script guides users through setting up the translation environment
and running translations automatically.
"""

import os
import sys
import subprocess
import platform
import argparse
from pathlib import Path

# Determine if we're running from an executable or Python script
is_executable = getattr(sys, 'frozen', False)
current_dir = os.path.dirname(os.path.abspath(__file__ if is_executable else __file__))

def check_python():
    """Check if Python is installed and has the required version."""
    try:
        python_version = platform.python_version()
        print(f"Found Python {python_version}")
        
        if tuple(map(int, python_version.split('.'))) < (3, 8):
            print("Warning: This script works best with Python 3.8 or higher.")
            if input("Continue anyway? (y/n): ").lower() != 'y':
                sys.exit(1)
        return True
    except Exception:
        print("Error: Python 3.8 or higher is required.")
        return False

def install_requirements():
    """Install required Python packages."""
    requirements = ['openai', 'azure-ai-translation-text', 'python-dotenv']
    # Mapping from package name to import name
    import_names = {
        'openai': 'openai',
        'azure-ai-translation-text': 'azure.ai.translation.text',
        'python-dotenv': 'dotenv'
    }
    
    print("Checking and installing required packages...")
    for package in requirements:
        import_name = import_names.get(package, package.replace('-', '_'))
        try:
            __import__(import_name)
            print(f"✓ {package} already installed")
        except ImportError:
            print(f"Installing {package}...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])
                print(f"✓ {package} installed successfully")
            except subprocess.CalledProcessError:
                print(f"Error: Failed to install {package}")
                return False
    return True

def setup_env_file():
    """Create or update the .env file with API keys."""
    env_path = os.path.join(current_dir, '.env')
    
    # Check if .env file exists
    if os.path.exists(env_path):
        print("\nFound existing .env file.")
        if input("Would you like to update it? (y/n): ").lower() != 'y':
            return True
    
    print("\n=== API Key Setup ===")
    print("You can use either Azure Translator or OpenAI for translations.")
    
    service = input("\nWhich service would you like to use? (azure/openai) [azure]: ").lower() or 'azure'
    
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write("# สำหรับ Azure Translation Service\n")
        if service == 'azure':
            azure_key = input("Enter your Azure Translator API key: ").strip()
            azure_region = input("Enter your Azure region [eastus]: ").strip() or 'eastus'
            f.write(f"AZURE_TRANSLATOR_KEY={azure_key}\n")
            f.write(f"AZURE_TRANSLATOR_REGION={azure_region}\n")
        else:
            f.write("AZURE_TRANSLATOR_KEY=\n")
            f.write("AZURE_TRANSLATOR_REGION=eastus\n")
        
        f.write("\n# สำหรับ OpenAI API\n")
        if service == 'openai':
            openai_key = input("Enter your OpenAI API key: ").strip()
            f.write(f"OPENAI_API_KEY={openai_key}\n")
            
            # Ask for custom API base (for Azure OpenAI)
            use_custom_base = input("Are you using Azure OpenAI? (y/n): ").lower() == 'y'
            if use_custom_base:
                api_base = input("Enter your Azure OpenAI endpoint: ").strip()
                f.write(f"OPENAI_API_BASE={api_base}\n")
        else:
            f.write("OPENAI_API_KEY=\n")
        
        f.write(f"\n# เลือก Translation Service (azure หรือ openai)\n")
        f.write(f"TRANSLATION_SERVICE={service}\n")
    
    print(f"\n✓ .env file created/updated at {env_path}")
    return True

def run_translation():
    """Run the translation based on user choices."""
    from pathlib import Path
    
    # Import the translation module (assuming it's in the same directory)
    sys.path.append(current_dir)
    try:
        from enhanced_translate_markdown import translate_markdown_file, translate_markdown_directory
    except ImportError:
        try:
            # Try to import from the obsidian-n-a directory
            sys.path.append(os.path.join(current_dir, "obsidian-n-a"))
            from enhanced_translate_markdown import translate_markdown_file, translate_markdown_directory
        except ImportError:
            print("Error: Could not import translation module.")
            print("Make sure 'enhanced_translate_markdown.py' is in the current directory or in the 'obsidian-n-a' subdirectory.")
            return False
    
    print("\n=== Translation Options ===")
    print("1. Translate a single file")
    print("2. Translate all files in a directory")
    print("3. Translate example documentation")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    source_lang = input("Source language code [en]: ").strip() or 'en'
    target_lang = input("Target language code [th]: ").strip() or 'th'
    
    if choice == '1':
        input_file = input("Enter the path to the input file: ").strip()
        output_file = input("Enter the path to the output file: ").strip()
        
        print(f"\nTranslating {input_file} to {output_file}...")
        translate_markdown_file(input_file, output_file, source_lang, target_lang)
        
    elif choice == '2':
        input_dir = input("Enter the path to the input directory: ").strip()
        output_dir = input("Enter the path to the output directory: ").strip()
        
        print(f"\nTranslating all files from {input_dir} to {output_dir}...")
        translate_markdown_directory(input_dir, output_dir, source_lang, target_lang)
        
    elif choice == '3':
        # Base directory detection
        plugin_dir = Path(current_dir).parent if "obsidian-n-a" in current_dir else current_dir
        obsidian_mind_pro_dir = plugin_dir / "ObsidianMind Pro"
        
        if not obsidian_mind_pro_dir.exists():
            print(f"Error: Could not find ObsidianMind Pro directory at {obsidian_mind_pro_dir}")
            obsidian_mind_pro_dir = Path(input("Enter the path to the ObsidianMind Pro directory: ").strip())
        
        # Files to translate
        files_to_translate = [
            ("README.md", "README.th.md"),
            ("INSTALLATION.md", "INSTALLATION.th.md"),
            ("USER_MANUAL.md", "USER_MANUAL.th.md"),
            ("EXAMPLES.md", "EXAMPLES.th.md"),
            ("AZURE_INTEGRATION_GUIDE.md", "AZURE_INTEGRATION_GUIDE.th.md"),
        ]
        
        for input_file, output_file in files_to_translate:
            input_path = obsidian_mind_pro_dir / input_file
            output_path = obsidian_mind_pro_dir / output_file
            
            if input_path.exists():
                print(f"\nTranslating {input_file} to {output_file}...")
                translate_markdown_file(str(input_path), str(output_path), source_lang, target_lang)
            else:
                print(f"Warning: {input_file} not found at {input_path}")
    
    else:
        print("Invalid choice.")
        return False
    
    print("\n✓ Translation completed successfully!")
    return True

def main():
    """Main function to run the setup and translation process."""
    print("=" * 60)
    print("ObsidianMind Pro - Translation Setup and Run Tool")
    print("=" * 60)
    
    if not check_python():
        return
    
    if not install_requirements():
        return
    
    if not setup_env_file():
        return
    
    if input("\nWould you like to run a translation now? (y/n): ").lower() == 'y':
        run_translation()
    
    print("\nSetup complete. You can now run translations using:")
    print("- enhanced_translate_markdown.py for individual files or directories")
    print("- run_enhanced_translation.bat (Windows) for a guided menu interface")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
