# Installation Guide for Obsidian AI Plugin

## Prerequisites

Before installing the Obsidian AI Plugin, ensure you have:

1. **Obsidian** installed on your device (desktop or mobile)
2. **API Keys** for at least one AI provider:
   - OpenAI API Key (for GPT models)
   - Anthropic API Key (for Claude models)
   - Google AI API Key (for Gemini models)
3. **Optional**: Notion Integration Token and Airtable API Key for external data integration

## Installation Methods

### Method 1: Manual Installation (Recommended)

1. **Download the Plugin**
   - Download the latest release from the [GitHub releases page](https://github.com/your-username/obsidian-ai-plugin/releases)
   - Extract the ZIP file to get the `obsidian-ai-plugin` folder

2. **Install in Obsidian**
   - Open your Obsidian vault
   - Navigate to your vault's `.obsidian/plugins` directory
     - On Windows: `[Vault Path]\.obsidian\plugins`
     - On macOS: `[Vault Path]/.obsidian/plugins`
     - On Linux: `[Vault Path]/.obsidian/plugins`
   - If the `plugins` folder doesn't exist, create it
   - Copy the `obsidian-ai-plugin` folder into the `plugins` directory

3. **Enable the Plugin**
   - Open Obsidian
   - Go to Settings (⚙️) → Community plugins
   - Find "Obsidian AI Plugin" in the installed plugins list
   - Toggle it ON

### Method 2: Development Installation

If you want to build from source:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/obsidian-ai-plugin.git
   cd obsidian-ai-plugin
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Plugin**
   ```bash
   npm run build
   ```

4. **Copy to Obsidian**
   - Copy the entire folder to your vault's `.obsidian/plugins` directory
   - Enable the plugin in Obsidian settings

## Initial Configuration

After installation, you need to configure the plugin:

### 1. Basic AI Model Setup

1. Open Obsidian Settings → Obsidian AI Plugin
2. In the "AI Model Settings" section:
   - Select your preferred AI model from the dropdown
   - Enter the corresponding API key:
     - **OpenAI**: Enter your API key (starts with `sk-`)
     - **Anthropic**: Enter your API key (starts with `sk-ant-`)
     - **Google**: Enter your API key (starts with `AI`)

### 2. Embedding Configuration

1. In the "Embedding Settings" section:
   - **Embedding Model**: Choose `all-MiniLM-L6-v2` for best performance on mobile devices
   - **Chunk Size**: Start with 500 characters (adjust based on your content)
   - **Chunk Overlap**: Use 50 characters for good context preservation

### 3. RAG Settings

1. Configure retrieval settings:
   - **Max Retrieved Chunks**: Start with 5 (increase for more context)
   - **Similarity Threshold**: Use 0.7 (lower for broader matches, higher for precise matches)

### 4. External Integrations (Optional)

#### Notion Setup
1. Create a Notion Integration:
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Name it "Obsidian AI Plugin"
   - Copy the integration token
2. Share databases with your integration:
   - Open each database you want to sync
   - Click "Share" → "Invite" → Select your integration
3. In plugin settings:
   - Paste the integration token
   - Add database IDs (found in database URLs)

#### Airtable Setup
1. Create a Personal Access Token:
   - Go to https://airtable.com/create/tokens
   - Create new token with `data.records:read` and `schema.bases:read` scopes
   - Add the bases you want to access
2. In plugin settings:
   - Paste the token
   - Add base IDs (found in base URLs)

### 5. Initial Data Processing

1. **Sync External Data** (if configured):
   - Click "Sync Now" in the External Integrations section
   - Wait for the sync to complete

2. **Build Embeddings**:
   - Click "Rebuild" in the Data Sync section
   - This will process all your notes and external data
   - **Note**: This may take several minutes depending on your data size

## Verification

To verify the installation is working:

1. **Open AI Chat**:
   - Click the robot icon (🤖) in the left sidebar
   - Or use the command palette: "Open AI Chat"

2. **Test Basic Functionality**:
   - Type a simple question about your notes
   - You should receive a response with relevant sources

3. **Check Settings**:
   - Ensure all API keys are properly configured
   - Verify embedding model is loaded (check console for any errors)

## Troubleshooting

### Common Issues

1. **Plugin Not Loading**
   - Ensure the folder is named exactly `obsidian-ai-plugin`
   - Check that all files are in the correct directory structure
   - Restart Obsidian after installation

2. **API Key Errors**
   - Verify API keys are correct and have proper permissions
   - Check your API usage limits and billing status
   - Ensure there are no extra spaces in the API key

3. **Embedding Issues**
   - Check browser console for error messages
   - Try using a smaller embedding model if on mobile
   - Ensure sufficient device memory is available

4. **Performance Issues**
   - Reduce chunk size for faster processing
   - Use a lighter embedding model (`all-MiniLM-L6-v2`)
   - Increase sync interval for external data

### Getting Help

If you encounter issues:

1. Check the [User Manual](USER_MANUAL.md) for detailed usage instructions
2. Review the [Examples](EXAMPLES.md) for common use cases
3. Report bugs on the [GitHub Issues page](https://github.com/your-username/obsidian-ai-plugin/issues)

## System Requirements

### Minimum Requirements
- **Desktop**: 4GB RAM, modern browser engine
- **Mobile**: 3GB RAM, recent iOS/Android version
- **Storage**: 100MB free space for models and cache

### Recommended Requirements
- **Desktop**: 8GB+ RAM for large knowledge bases
- **Mobile**: 4GB+ RAM for smooth performance
- **Storage**: 500MB+ for multiple embedding models

## Security Notes

- API keys are stored locally in your Obsidian vault
- Embedding processing happens on your device
- Only chat messages and retrieved context are sent to AI providers
- No personal data is transmitted during embedding generation

## Updates

To update the plugin:

1. Download the latest release
2. Replace the old plugin folder with the new one
3. Restart Obsidian
4. Check settings for any new configuration options

The plugin will automatically migrate your settings to new versions when possible.

