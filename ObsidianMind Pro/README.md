# Obsidian AI Plugin

This is a powerful AI plugin for Obsidian that brings the capabilities of large language models (LLMs) and Retrieval-Augmented Generation (RAG) to your personal knowledge base. It allows you to chat with your notes, connect to external data sources like Notion and Airtable, and leverage advanced features like prompt generation, macro commands, and custom tools.

## Features

- **Chat with your knowledge base:** Have intelligent conversations with an AI that understands the content of your notes.
- **Retrieval-Augmented Generation (RAG):** The AI uses your notes and external data as context to provide more accurate and relevant answers.
- **On-device Embedding:** Embeddings are generated and stored locally on your device for privacy and offline access.
- **Multi-source Integration:** Connect to Notion databases and Airtable bases to include them in your knowledge base.
- **Multi-model Support:** Choose from a variety of large language models from OpenAI, Anthropic, and Google.
- **Azure AI Services Integration:** Connect to comprehensive Azure AI services including Azure OpenAI, Azure AI Search, Azure Agent, and Azure Cosmos DB.
- **Customizable Prompts:** Create and use your own prompt templates for consistent and repeatable results.
- **Macro Commands:** Automate complex workflows by chaining together multiple commands and AI actions.
- **Custom Tools:** Extend the plugin's functionality by adding your own tools via JSON.
- **Templater Integration:** Use AI functions directly within your Templater templates.

## Getting Started

1. **Installation:**
   - Download the latest release from the [releases page](https://github.com/your-username/obsidian-ai-plugin/releases).
   - Unzip the downloaded file and place the `obsidian-ai-plugin` folder in your Obsidian vault's `.obsidian/plugins` directory.
   - Reload Obsidian and enable the "Obsidian AI Plugin" in the settings.

2. **Configuration:**
   - Open the plugin settings in Obsidian.
   - **AI Model Settings:**
     - Select your preferred AI model.
     - Enter your API keys for the corresponding services (OpenAI, Anthropic, Google).
   - **Embedding Settings:**
     - Choose an embedding model. `all-MiniLM-L6-v2` is recommended for most users due to its small size and good performance.
     - Adjust chunk size and overlap as needed.
   - **External Integrations:**
     - To connect to Notion, enter your Notion integration token and database IDs.
     - To connect to Airtable, enter your Airtable API key and base IDs.
   - **Sync and Embed:**
     - Go to the "Actions" section in the settings.
     - Click "Sync Now" to fetch data from Notion and Airtable.
     - Click "Rebuild" to generate embeddings for all your data.

3. **Usage:**
   - Open the AI Chat view by clicking the robot icon in the left sidebar.
   - Start chatting with your notes!
   - Use the settings panel in the chat view to manage your settings and data.

## Advanced Features

### Templater Integration

If you have the Templater plugin installed, you can use the following AI functions in your templates:

- `tp.user.ai_chat(prompt)`: Send a prompt to the AI and get a response.
- `tp.user.ai_search(query, maxResults)`: Search your knowledge base and get a list of relevant sources.
- `tp.user.ai_summarize(content, maxLength)`: Summarize a piece of text.
- `tp.user.ai_generate_content(topic, type, length)`: Generate content on a given topic.
- `tp.user.ai_extract_info(content, infoType)`: Extract specific information from a text.

### Prompt Generator

The plugin comes with a set of default prompt templates for common tasks like summarizing, brainstorming, and analyzing. You can also create your own custom templates in the settings.

### Macro Command Processor (MCP)

The MCP allows you to create complex workflows by chaining together multiple steps. You can create your own macros in the settings.

### Custom Tools

You can extend the plugin's functionality by adding your own tools via JSON. This allows you to integrate with other APIs and services.

## Performance

The plugin is designed to be as performant as possible, even on mobile devices. The embedding model runs on-device, and the plugin uses batch processing to speed up embedding generation. However, the initial embedding process can take some time, depending on the size of your knowledge base.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/your-username/obsidian-ai-plugin).

## License

This plugin is licensed under the [MIT License](LICENSE).


