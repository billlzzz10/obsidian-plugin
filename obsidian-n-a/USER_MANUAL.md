# Obsidian AI Plugin User Manual

## Introduction
Welcome to the Obsidian AI Plugin! This manual will guide you through the installation, configuration, and usage of the plugin, helping you unlock the power of AI within your Obsidian vault.

## Table of Contents

1.  [Installation](#1-installation)
2.  [Initial Setup and Configuration](#2-initial-setup-and-configuration)
    *   [AI Model Settings](#ai-model-settings)
    *   [Embedding Settings](#embedding-settings)
    *   [External Integrations (Notion & Airtable)](#external-integrations-notion--airtable)
    *   [Data Sync and Embedding](#data-sync-and-embedding)
3.  [Using the AI Chat](#3-using-the-ai-chat)
4.  [Advanced Features](#4-advanced-features)
    *   [Templater Integration](#templater-integration)
    *   [Prompt Generator](#prompt-generator)
    *   [Macro Command Processor (MCP)](#macro-command-processor-mcp)
    *   [Custom Tools](#custom-tools)
5.  [Troubleshooting](#5-troubleshooting)
6.  [FAQ](#6-faq)

## 1. Installation

To install the Obsidian AI Plugin, follow these steps:

1.  **Download the Plugin:** Go to the [releases page](https://github.com/your-username/obsidian-ai-plugin/releases) on GitHub and download the latest `.zip` file.
2.  **Extract the Files:** Unzip the downloaded file. You should find a folder named `obsidian-ai-plugin`.
3.  **Place in Vault:** Navigate to your Obsidian vault's `.obsidian/plugins` directory. If the `plugins` folder doesn't exist, create it.
4.  **Copy the Folder:** Copy the `obsidian-ai-plugin` folder into the `.obsidian/plugins` directory.
5.  **Enable Plugin:**
    *   Open Obsidian.
    *   Go to `Settings` (gear icon in the bottom left).
    *   Navigate to `Community plugins`.
    *   Under `Installed plugins`, find "Obsidian AI Plugin" and toggle it on.

## 2. Initial Setup and Configuration

After enabling the plugin, you'll need to configure it. Go to `Settings` -> `Obsidian AI Plugin`.

### AI Model Settings

This section allows you to choose which Large Language Model (LLM) the plugin will use for chat and other AI-powered features.

*   **Selected Model:** Choose from a list of supported models (e.g., GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro). Select the model that best suits your needs and budget.
*   **API Keys:** Enter your API keys for the chosen model's provider (OpenAI, Anthropic, Google). These keys are essential for the plugin to communicate with the AI services. Your API keys are stored locally and securely within your Obsidian vault.
    *   **OpenAI API Key:** `sk-...`
    *   **Anthropic API Key:** `sk-ant-...`
    *   **Google AI API Key:** `AI...`

### Embedding Settings

Embeddings are numerical representations of your text data, crucial for the RAG (Retrieval-Augmented Generation) feature. These settings control how your notes and external data are processed into embeddings.

*   **Embedding Model:** Select an embedding model. We recommend `all-MiniLM-L6-v2` for its balance of performance and efficiency, especially on mobile devices. Larger models like `all-mpnet-base-v2` offer higher accuracy but require more resources.
*   **Chunk Size:** Defines the maximum number of characters in each text chunk before it's embedded. A larger chunk size means more context per chunk but might reduce the granularity of retrieval. (Default: 500, Range: 100-2000)
*   **Chunk Overlap:** Specifies the number of characters that overlap between consecutive chunks. Overlap helps maintain context across chunk boundaries. (Default: 50, Range: 0-500)

### RAG Settings

These settings fine-tune how the RAG system retrieves relevant information from your knowledge base.

*   **Max Retrieved Chunks:** The maximum number of relevant text chunks the AI will retrieve from your knowledge base to use as context for its responses. More chunks can provide richer context but might increase processing time. (Default: 5, Range: 1-20)
*   **Similarity Threshold:** The minimum similarity score a retrieved chunk must have to be considered relevant. A higher threshold means only very similar content will be retrieved, while a lower one will include broader matches. (Default: 0.7, Range: 0.1-1.0)

### External Integrations (Notion & Airtable)

Connect your Notion databases and Airtable bases to include their content in your AI knowledge base.

*   **Notion Integration Token:** Your Notion integration token (starts with `secret_`). Follow Notion's documentation to create an internal integration and grant it access to your databases.
*   **Notion Database IDs:** A comma-separated list of Notion database IDs you want to sync. You can find the database ID in the URL of your Notion database.
*   **Airtable API Key:** Your Airtable Personal Access Token (starts with `pat`). Create one in your Airtable account settings.
*   **Airtable Base IDs:** A comma-separated list of Airtable base IDs you want to sync. You can find the base ID in the URL of your Airtable base.
*   **Auto Sync:** Enable this to automatically sync external data at regular intervals.
*   **Sync Interval:** Set the frequency (in minutes) for automatic data synchronization. (Default: 60, Range: 5-1440)

### Data Sync and Embedding

After configuring your integrations, you need to sync your data and generate embeddings.

*   **Sync External Data:** Click "Sync Now" to manually fetch the latest data from your configured Notion databases and Airtable bases. This will update the plugin's internal cache of your external data.
*   **Rebuild Embeddings:** Click "Rebuild" to re-process all your Obsidian notes, Notion pages, and Airtable records into embeddings. This is necessary after significant changes to your data or embedding settings. **Note:** This process can take some time depending on the size of your knowledge base.

## 3. Using the AI Chat

To start chatting with your knowledge base:

1.  **Open the AI Chat View:** Click the robot icon (🤖) in the left sidebar of Obsidian. This will open the AI Chat panel.
2.  **Type Your Question:** Enter your question or prompt in the input field at the bottom of the chat panel.
3.  **Send Message:** Press `Enter` to send your message. Use `Shift + Enter` for a new line.
4.  **View Response:** The AI will process your request and provide a response. If `Show Sources` is enabled in settings, you will see the relevant sources that the AI used to formulate its answer.

**Chat Features:**

*   **Clear Chat:** Click the trash can icon (🗑️) in the header to clear the current chat history.
*   **Sync Data:** Click the refresh icon (🔄) in the header to manually trigger a data sync.
*   **Settings:** Click the gear icon (⚙️) to open the in-chat settings panel for quick adjustments.

## 4. Advanced Features

### Templater Integration

If you have the [Templater plugin](https://github.com/SilentVoid13/Templater) installed and enabled, you can directly access AI functions within your templates. This allows for dynamic content generation and information retrieval.

To use these functions, ensure your Templater settings allow user functions. You can then call them using `tp.user.ai_function_name(...)`.

Available functions:

*   `tp.user.ai_chat(prompt: string)`: Sends a prompt to the configured AI model and returns its response.
    ```liquid
    <% tp.user.ai_chat("Summarize the key points of this note: " + tp.file.content) %>
    ```
*   `tp.user.ai_search(query: string, maxResults?: number)`: Searches your knowledge base (Obsidian notes, Notion, Airtable) for relevant information based on the query and returns a formatted string of the top `maxResults` sources.
    ```liquid
    <% tp.user.ai_search("What are the benefits of spaced repetition?", 3) %>
    ```
*   `tp.user.ai_summarize(content: string, maxLength?: number)`: Summarizes the provided `content` to approximately `maxLength` characters.
    ```liquid
    <% tp.user.ai_summarize(tp.file.content, 500) %>
    ```
*   `tp.user.ai_generate_content(topic: string, type?: string, length?: string)`: Generates content on a given `topic`. `type` can be 'paragraph', 'essay', 'list', etc. `length` can be 'short', 'medium', 'long'.
    ```liquid
    <% tp.user.ai_generate_content("The history of AI", "essay", "long") %>
    ```
*   `tp.user.ai_extract_info(content: string, infoType: string)`: Extracts specific `infoType` (e.g., 'keywords', 'dates', 'names') from the provided `content`.
    ```liquid
    <% tp.user.ai_extract_info(tp.file.content, "keywords") %>
    ```

### Prompt Generator

The Prompt Generator helps you create effective prompts for various tasks. It includes a set of predefined templates and allows you to create your own.

*   **Accessing Templates:** You can access the prompt templates through a command palette command (e.g., `Obsidian AI: Generate Prompt`).
*   **Using Templates:** Select a template, fill in the required variables, and the plugin will generate a tailored prompt for you, optionally incorporating RAG context.
*   **Custom Templates:** In the plugin settings, you can define your own prompt templates using placeholders like `{{variable_name}}`. These custom templates will appear alongside the default ones.

### Macro Command Processor (MCP)

(Coming Soon: Detailed instructions for creating and managing macros via UI or JSON configuration.)

The MCP allows you to automate complex sequences of actions, combining AI chat, prompt generation, and tool usage. For example, you could create a macro that:

1.  Summarizes the active note.
2.  Generates a set of questions based on the summary.
3.  Uses the AI to answer those questions by searching your knowledge base.
4.  Creates a new note with the summarized content and answers.

### Custom Tools

(Coming Soon: Detailed instructions for adding custom tools via UI or JSON configuration.)

Extend the plugin's capabilities by defining your own tools. These tools can be simple functions that interact with Obsidian, or they can call external APIs. Custom tools are defined using a JSON structure and can be invoked by the AI or within Macro Commands.

## 5. Troubleshooting

*   **Plugin not loading:** Ensure the `obsidian-ai-plugin` folder is directly inside `.obsidian/plugins` and not nested in another folder.
*   **API Key Errors:** Double-check your API keys for typos. Ensure they have the necessary permissions from your AI provider.
*   **Embedding Issues:** If RAG results are poor, try rebuilding embeddings from the settings. Ensure your `chunkSize` and `chunkOverlap` settings are appropriate for your content.
*   **Performance:** If the plugin feels slow, especially during embedding, consider using a smaller embedding model (e.g., `all-MiniLM-L6-v2`) or reducing the frequency of auto-sync.

## 6. FAQ

*   **Is my data sent to external servers?**
    *   Your notes and external data are processed locally for embedding. Only the text you send to the AI model (your chat messages and the retrieved context) is sent to the respective AI provider (OpenAI, Anthropic, Google).
*   **Can I use this offline?**
    *   The embedding and RAG features work offline once embeddings are generated. However, the AI chat functionality requires an internet connection to communicate with the LLM providers.
*   **How many notes can it handle?**
    *   The plugin is designed to handle large knowledge bases. Performance depends on your device's specifications and the chosen embedding model. We recommend testing with your typical note volume.

If you encounter any issues not covered here, please report them on the [GitHub repository](https://github.com/your-username/obsidian-ai-plugin/issues).


