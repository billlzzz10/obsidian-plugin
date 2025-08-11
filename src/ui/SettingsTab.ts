import { App, PluginSettingTab, Setting } from 'obsidian';
import AIPlugin from '../../main';

// Custom interfaces based on ObsidianMind Pro settings
interface MacroCommand {
    id: string;
    name: string;
    description: string;
    steps: MacroCommandStep[];
}

interface MacroCommandStep {
    type: 'ai_chat' | 'ai_generate_prompt' | 'ai_tool_use' | 'obsidian_command';
    value: string;
    parameters?: Record<string, unknown>;
    outputVariable?: string;
    inputVariable?: string;
}

interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    variables: string[];
    category: string;
}

interface Tool {
    id: string;
    name: string;
    description: string;
    parameters: ToolParameter[];
    handler?: string;
    category: string;
}

interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default?: unknown;
}

interface CustomModelConfig {
    id: string;
    name: string;
    apiEndpoint: string;
    apiKey: string;
    modelType: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
    maxTokens: number;
    temperature: number;
}

interface MCPServiceConfig {
    name: string;
    type: 'stdio' | 'http';
    enabled: boolean;
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
}

// Interface for plugin settings
interface AIPluginSettings {
    // Backend settings
    backendUrl?: string;
    apiKey?: string;
    
    // AI Model Settings
    aiProvider?: 'openai' | 'anthropic' | 'google' | 'azure';
    selectedModel: string;
    openaiApiKey: string;
    anthropicApiKey: string;
    googleApiKey: string;
    azureApiKey: string;
    azureEndpoint: string;
    azureRegion: string;
    customModels: CustomModelConfig[];

    // Custom Features
    customMacroCommands: MacroCommand[];
    customPromptTemplates: PromptTemplate[];
    customTools: Tool[];

    // Azure AI Services Settings
    azureAIServicesEnabled: boolean;
    azureOpenAIApiKey: string;
    azureOpenAIEndpoint: string;
    azureOpenAIDeploymentName: string;
    azureAISearchApiKey: string;
    azureAISearchEndpoint: string;
    azureAISearchIndexName: string;
    azureAISearchApiVersion: string;
    azureAgentEnabled: boolean;
    azureAgentEndpoint: string;
    azureAgentApiKey: string;
    azureAgentName: string;
    azureAgentApiVersion: string;
    azureCosmosDBEnabled: boolean;
    azureCosmosDBEndpoint: string;
    azureCosmosDBKey: string;
    azureCosmosDBDatabaseId: string;
    azureCosmosDBContainerId: string;

    // Embedding Settings
    embeddingModel: string;
    embeddingDimensions: number;
    chunkSize: number;
    chunkOverlap: number;

    // RAG Settings
    maxRetrievedChunks: number;
    similarityThreshold: number;
    contextWindowSize: number;
    ragEnabled: boolean;

    // External Integration Settings
    notionIntegrationToken: string;
    notionDatabaseIds: string[];
    airtableApiKey: string;
    airtableBaseIds: string[];
    syncInterval: number;
    autoSync: boolean;

    // Chat Settings
    maxChatHistory: number;
    showSources: boolean;
    streamResponses: boolean;

    // Advanced Features
    templaterIntegration: boolean;
    mcpEnabled: boolean;
    customToolsEnabled: boolean;
    customToolsConfig: string;

    // MCP Services
    mcpServices: MCPServiceConfig[];
    notionMcpEnabled: boolean;
    zapierMcpEnabled: boolean;
    figmaMcpEnabled: boolean;

    // Performance Settings
    maxConcurrentRequests: number;
    requestTimeout: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    
    [key: string]: unknown; // For any additional values that may be added
}

// Function to send data to backend with API keys
export async function sendToBackend(url: string, data: Record<string, unknown>, settings: AIPluginSettings) {
    // Add API keys from plugin settings
    const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': settings.apiKey || '',
        'X-OpenAI-Key': settings.openaiApiKey || '',
        'X-Azure-OpenAI-Key': settings.azureApiKey || '',
        'X-Azure-OpenAI-Endpoint': settings.azureEndpoint || '',
        'X-Azure-OpenAI-Deployment': settings.azureOpenAIDeploymentName || ''
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
}

// อ้างอิงโมเดลที่รองรับจาก ObsidianMind Pro
const SUPPORTED_MODELS = {
    OPENAI: {
        'gpt-4': { maxTokens: 8192, supportsStreaming: true },
        'gpt-4o': { maxTokens: 128000, supportsStreaming: true },
        'gpt-4o-mini': { maxTokens: 128000, supportsStreaming: true },
        'gpt-3.5-turbo': { maxTokens: 16385, supportsStreaming: true }
    },
    ANTHROPIC: {
        'claude-3-opus': { maxTokens: 200000, supportsStreaming: true },
        'claude-3-sonnet': { maxTokens: 200000, supportsStreaming: true },
        'claude-3-haiku': { maxTokens: 200000, supportsStreaming: true }
    },
    GOOGLE: {
        'gemini-pro': { maxTokens: 32768, supportsStreaming: true },
        'gemini-pro-vision': { maxTokens: 32768, supportsStreaming: false }
    },
    AZURE: {
        'azure-gpt-4': { maxTokens: 8192, supportsStreaming: true },
        'azure-gpt-35': { maxTokens: 16385, supportsStreaming: true }
    }
};

// อ้างอิงโมเดล Embedding จาก ObsidianMind Pro
const EMBEDDING_MODELS = {
    'sentence-transformers/all-MiniLM-L6-v2': { dimensions: 384, local: true },
    'azure-embedding': { dimensions: 1536, local: false },
    'openai-embedding': { dimensions: 1536, local: false }
};

export class AIPluginSettingTab extends PluginSettingTab {
    plugin: AIPlugin;

    constructor(app: App, plugin: AIPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('obsidian-ai-settings-container');
        containerEl.createEl('h2', { text: 'Obsidian AI Enhanced Settings', cls: 'obsidian-ai-settings-title' });

        this.createBackendSettings(containerEl);
        this.createModelSettings(containerEl);
        this.createEmbeddingRagSettings(containerEl);
        this.createAzureSettings(containerEl);
        this.createExternalIntegrationSettings(containerEl);
        this.createMacroSettings(containerEl);
        this.createMCPSettings(containerEl);
        this.createChatSettings(containerEl);
        this.createActionButtons(containerEl);
    }

    private createBackendSettings(containerEl: HTMLElement): void {
        const backendSection = containerEl.createDiv({ cls: 'obsidian-ai-settings-section' });
        backendSection.createEl('h3', { text: 'Backend Settings', cls: 'obsidian-ai-settings-section-title' });
        
        new Setting(backendSection)
            .setName('Backend URL')
            .setDesc('URL of your AI backend service (e.g., https://your-obsidian-backend.azurewebsites.net)')
            .addText(text => text
                .setPlaceholder('https://...')
                .setValue(this.plugin.settings.backendUrl || 'http://localhost:8000')
                .onChange(async (value) => {
                    this.plugin.settings.backendUrl = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(backendSection)
            .setName('Backend API Key')
            .setDesc('API key for secure communication with backend')
            .addText(text => text
                .setPlaceholder('Enter a strong API key')
                .setValue(this.plugin.settings.apiKey || '')
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
    }

    private createModelSettings(containerEl: HTMLElement): void {
        const modelSection = containerEl.createDiv({ cls: 'obsidian-ai-settings-section' });
        modelSection.createEl('h3', { text: 'AI Model Settings', cls: 'obsidian-ai-settings-section-title' });
        
        // Provider selection
        new Setting(modelSection)
            .setName('AI Provider')
            .setDesc('Select which AI provider to use')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('openai', 'OpenAI')
                    .addOption('anthropic', 'Anthropic')
                    .addOption('google', 'Google')
                    .addOption('azure', 'Azure OpenAI')
                    .setValue(this.plugin.settings.aiProvider || 'openai')
                    .onChange(async (value) => {
                        this.plugin.settings.aiProvider = value as 'openai' | 'anthropic' | 'google' | 'azure';
                        await this.plugin.saveData(this.plugin.settings);
                        // Refresh the display to update model options based on provider
                        this.display();
                    });
            });

        // Conditionally show provider-specific settings
        if (this.plugin.settings.aiProvider === 'openai' || !this.plugin.settings.aiProvider) {
            new Setting(modelSection)
                .setName('OpenAI API Key')
                .setDesc('API key for OpenAI API')
                .addText(text => text
                    .setPlaceholder('sk-...')
                    .setValue(this.plugin.settings.openaiApiKey || '')
                    .onChange(async (value) => {
                        this.plugin.settings.openaiApiKey = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            // OpenAI models dropdown
            new Setting(modelSection)
                .setName('OpenAI Model')
                .setDesc('The OpenAI model to use for AI operations')
                .addDropdown(dropdown => {
                    // Add OpenAI models from SUPPORTED_MODELS
                    Object.keys(SUPPORTED_MODELS.OPENAI).forEach((modelId) => {
                        dropdown.addOption(modelId, `OpenAI: ${modelId}`);
                    });
                    
                    dropdown.setValue(this.plugin.settings.selectedModel || 'gpt-3.5-turbo')
                    .onChange(async (value) => {
                        this.plugin.settings.selectedModel = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
                });
        }
        
        // Anthropic settings
        if (this.plugin.settings.aiProvider === 'anthropic') {
            new Setting(modelSection)
                .setName('Anthropic API Key')
                .setDesc('API key for Anthropic API')
                .addText(text => text
                    .setPlaceholder('sk-ant-...')
                    .setValue(this.plugin.settings.anthropicApiKey || '')
                    .onChange(async (value) => {
                        this.plugin.settings.anthropicApiKey = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            // Anthropic models dropdown
            new Setting(modelSection)
                .setName('Anthropic Model')
                .setDesc('The Anthropic model to use for AI operations')
                .addDropdown(dropdown => {
                    // Add Anthropic models from SUPPORTED_MODELS
                    Object.keys(SUPPORTED_MODELS.ANTHROPIC).forEach((modelId) => {
                        dropdown.addOption(modelId, `Anthropic: ${modelId}`);
                    });
                    
                    dropdown.setValue(this.plugin.settings.selectedModel || 'claude-3-opus-20240229')
                    .onChange(async (value) => {
                        this.plugin.settings.selectedModel = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
                });
        }
        
        // Google settings
        if (this.plugin.settings.aiProvider === 'google') {
            new Setting(modelSection)
                .setName('Google API Key')
                .setDesc('API key for Google Gemini API')
                .addText(text => text
                    .setPlaceholder('API key')
                    .setValue(this.plugin.settings.googleApiKey || '')
                    .onChange(async (value) => {
                        this.plugin.settings.googleApiKey = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            // Google models dropdown
            new Setting(modelSection)
                .setName('Google Model')
                .setDesc('The Google model to use for AI operations')
                .addDropdown(dropdown => {
                    // Add Google models from SUPPORTED_MODELS
                    Object.keys(SUPPORTED_MODELS.GOOGLE).forEach((modelId) => {
                        dropdown.addOption(modelId, `Google: ${modelId}`);
                    });
                    
                    dropdown.setValue(this.plugin.settings.selectedModel || 'gemini-pro')
                    .onChange(async (value) => {
                        this.plugin.settings.selectedModel = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
                });
        }
    }

    private createEmbeddingRagSettings(containerEl: HTMLElement): void {
        const ragSection = containerEl.createDiv({ cls: 'obsidian-ai-settings-section' });
        ragSection.createEl('h3', { text: 'Embedding & RAG Settings', cls: 'obsidian-ai-settings-section-title' });
        
        new Setting(ragSection)
            .setName('RAG Enabled')
            .setDesc('Enable Retrieval Augmented Generation')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.ragEnabled !== false)
                .onChange(async (value) => {
                    this.plugin.settings.ragEnabled = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(ragSection)
            .setName('Embedding Model')
            .setDesc('Choose the embedding model for RAG')
            .addDropdown(dropdown => {
                // Add embedding models from EMBEDDING_MODELS
                Object.keys(EMBEDDING_MODELS).forEach(modelId => {
                    dropdown.addOption(modelId, modelId);
                });
                
                dropdown.setValue(this.plugin.settings.embeddingModel || 'sentence-transformers/all-MiniLM-L6-v2')
                    .onChange(async (value) => {
                        this.plugin.settings.embeddingModel = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });
            
        new Setting(ragSection)
            .setName('Chunk Size')
            .setDesc('Size of text chunks for embedding (100-2000 characters)')
            .addSlider(slider => slider
                .setLimits(100, 2000, 100)
                .setValue(this.plugin.settings.chunkSize || 500)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.chunkSize = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(ragSection)
            .setName('Chunk Overlap')
            .setDesc('Overlap between chunks (0-500 characters)')
            .addSlider(slider => slider
                .setLimits(0, 500, 50)
                .setValue(this.plugin.settings.chunkOverlap || 100)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.chunkOverlap = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(ragSection)
            .setName('Max Retrieved Chunks')
            .setDesc('Maximum number of chunks to retrieve for context')
            .addSlider(slider => slider
                .setLimits(1, 20, 1)
                .setValue(this.plugin.settings.maxRetrievedChunks || 5)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxRetrievedChunks = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(ragSection)
            .setName('Similarity Threshold')
            .setDesc('Minimum similarity score for retrieved chunks')
            .addSlider(slider => slider
                .setLimits(0.1, 1.0, 0.1)
                .setValue(this.plugin.settings.similarityThreshold || 0.7)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.similarityThreshold = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
    }

    private createAzureSettings(containerEl: HTMLElement): void {
        // Only show Azure settings if Azure is the selected provider
        if (this.plugin.settings.aiProvider !== 'azure') {
            return;
        }
        
        const azureSection = containerEl.createDiv({ cls: 'obsidian-ai-settings-section' });
        azureSection.createEl('h3', { text: 'Azure AI Services', cls: 'obsidian-ai-settings-section-title' });
        
        new Setting(azureSection)
            .setName('Azure OpenAI API Key')
            .setDesc('API key for Azure OpenAI')
            .addText(text => text
                .setPlaceholder('Azure OpenAI key')
                .setValue(this.plugin.settings.azureApiKey || '')
                .onChange(async (value) => {
                    this.plugin.settings.azureApiKey = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(azureSection)
            .setName('Azure OpenAI Endpoint')
            .setDesc('Your Azure OpenAI service endpoint')
            .addText(text => text
                .setPlaceholder('https://{resource-name}.openai.azure.com')
                .setValue(this.plugin.settings.azureEndpoint || '')
                .onChange(async (value) => {
                    this.plugin.settings.azureEndpoint = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(azureSection)
            .setName('Azure Region')
            .setDesc('Azure region (e.g., eastus)')
            .addText(text => text
                .setPlaceholder('eastus')
                .setValue(this.plugin.settings.azureRegion || '')
                .onChange(async (value) => {
                    this.plugin.settings.azureRegion = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        // Azure model selection
        new Setting(azureSection)
            .setName('Azure OpenAI Model')
            .setDesc('The Azure OpenAI model to use')
            .addDropdown(dropdown => {
                // Add Azure models from SUPPORTED_MODELS
                Object.keys(SUPPORTED_MODELS.AZURE).forEach((modelId) => {
                    dropdown.addOption(modelId, `Azure: ${modelId}`);
                });
                
                dropdown.setValue(this.plugin.settings.selectedModel || 'azure-gpt-35')
                .onChange(async (value) => {
                    this.plugin.settings.selectedModel = value;
                    await this.plugin.saveData(this.plugin.settings);
                });
            });
                
        new Setting(azureSection)
            .setName('Azure OpenAI Deployment')
            .setDesc('Your Azure OpenAI deployment name')
            .addText(text => text
                .setPlaceholder('deployment-name')
                .setValue(this.plugin.settings.azureOpenAIDeploymentName || '')
                .onChange(async (value) => {
                    this.plugin.settings.azureOpenAIDeploymentName = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        // Additional Azure services
        new Setting(azureSection)
            .setName('Enable Azure AI Search')
            .setDesc('Use Azure AI Search for vector search')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.azureAIServicesEnabled || false)
                .onChange(async (value) => {
                    this.plugin.settings.azureAIServicesEnabled = value;
                    await this.plugin.saveData(this.plugin.settings);
                    // Refresh settings to show/hide additional fields
                    this.display();
                }));
                
        if (this.plugin.settings.azureAIServicesEnabled) {
            new Setting(azureSection)
                .setName('Azure AI Search API Key')
                .setDesc('API key for Azure AI Search')
                .addText(text => text
                    .setPlaceholder('Azure AI Search key')
                    .setValue(this.plugin.settings.azureAISearchApiKey || '')
                    .onChange(async (value) => {
                        this.plugin.settings.azureAISearchApiKey = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            new Setting(azureSection)
                .setName('Azure AI Search Endpoint')
                .setDesc('Your Azure AI Search service endpoint')
                .addText(text => text
                    .setPlaceholder('https://{service-name}.search.windows.net')
                    .setValue(this.plugin.settings.azureAISearchEndpoint || '')
                    .onChange(async (value) => {
                        this.plugin.settings.azureAISearchEndpoint = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            new Setting(azureSection)
                .setName('Azure AI Search Index')
                .setDesc('Your Azure AI Search index name')
                .addText(text => text
                    .setPlaceholder('index-name')
                    .setValue(this.plugin.settings.azureAISearchIndexName || '')
                    .onChange(async (value) => {
                        this.plugin.settings.azureAISearchIndexName = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            new Setting(azureSection)
                .setName('Azure AI Search API Version')
                .setDesc('API version for Azure AI Search')
                .addText(text => text
                    .setPlaceholder('2023-07-01-Preview')
                    .setValue(this.plugin.settings.azureAISearchApiVersion || '2023-07-01-Preview')
                    .onChange(async (value) => {
                        this.plugin.settings.azureAISearchApiVersion = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
        }
        
        // Azure Agent (AI Assistant)
        new Setting(azureSection)
            .setName('Enable Azure AI Assistant')
            .setDesc('Use Azure AI Assistant for advanced AI capabilities')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.azureAgentEnabled || false)
                .onChange(async (value) => {
                    this.plugin.settings.azureAgentEnabled = value;
                    await this.plugin.saveData(this.plugin.settings);
                    // Refresh settings to show/hide additional fields
                    this.display();
                }));
                
        if (this.plugin.settings.azureAgentEnabled) {
            new Setting(azureSection)
                .setName('Azure AI Assistant Endpoint')
                .setDesc('Your Azure AI Assistant endpoint')
                .addText(text => text
                    .setPlaceholder('https://{assistant-name}.azurewebsites.net')
                    .setValue(this.plugin.settings.azureAgentEndpoint || '')
                    .onChange(async (value) => {
                        this.plugin.settings.azureAgentEndpoint = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            new Setting(azureSection)
                .setName('Azure AI Assistant API Key')
                .setDesc('API key for Azure AI Assistant')
                .addText(text => text
                    .setPlaceholder('Assistant API key')
                    .setValue(this.plugin.settings.azureAgentApiKey || '')
                    .onChange(async (value) => {
                        this.plugin.settings.azureAgentApiKey = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            new Setting(azureSection)
                .setName('Azure AI Assistant Name')
                .setDesc('Name of your Azure AI Assistant')
                .addText(text => text
                    .setPlaceholder('Assistant name')
                    .setValue(this.plugin.settings.azureAgentName || '')
                    .onChange(async (value) => {
                        this.plugin.settings.azureAgentName = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
        }
        
        // Azure Cosmos DB
        new Setting(azureSection)
            .setName('Enable Azure Cosmos DB')
            .setDesc('Use Azure Cosmos DB for persistent storage')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.azureCosmosDBEnabled || false)
                .onChange(async (value) => {
                    this.plugin.settings.azureCosmosDBEnabled = value;
                    await this.plugin.saveData(this.plugin.settings);
                    // Refresh settings to show/hide additional fields
                    this.display();
                }));
                
        if (this.plugin.settings.azureCosmosDBEnabled) {
            new Setting(azureSection)
                .setName('Azure Cosmos DB Endpoint')
                .setDesc('Your Azure Cosmos DB endpoint')
                .addText(text => text
                    .setPlaceholder('https://{account-name}.documents.azure.com:443/')
                    .setValue(this.plugin.settings.azureCosmosDBEndpoint || '')
                    .onChange(async (value) => {
                        this.plugin.settings.azureCosmosDBEndpoint = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            new Setting(azureSection)
                .setName('Azure Cosmos DB Key')
                .setDesc('Primary key for Azure Cosmos DB')
                .addText(text => text
                    .setPlaceholder('Cosmos DB key')
                    .setValue(this.plugin.settings.azureCosmosDBKey || '')
                    .onChange(async (value) => {
                        this.plugin.settings.azureCosmosDBKey = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            new Setting(azureSection)
                .setName('Azure Cosmos DB Database ID')
                .setDesc('Database ID for Azure Cosmos DB')
                .addText(text => text
                    .setPlaceholder('database-id')
                    .setValue(this.plugin.settings.azureCosmosDBDatabaseId || '')
                    .onChange(async (value) => {
                        this.plugin.settings.azureCosmosDBDatabaseId = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            new Setting(azureSection)
                .setName('Azure Cosmos DB Container ID')
                .setDesc('Container ID for Azure Cosmos DB')
                .addText(text => text
                    .setPlaceholder('container-id')
                    .setValue(this.plugin.settings.azureCosmosDBContainerId || '')
                    .onChange(async (value) => {
                        this.plugin.settings.azureCosmosDBContainerId = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
        }
    }

    private createExternalIntegrationSettings(containerEl: HTMLElement): void {
        const integrationSection = containerEl.createDiv({ cls: 'obsidian-ai-settings-section' });
        integrationSection.createEl('h3', { text: 'External Integrations', cls: 'obsidian-ai-settings-section-title' });
        
        new Setting(integrationSection)
            .setName('Notion Integration Token')
            .setDesc('Your Notion integration token')
            .addText(text => text
                .setPlaceholder('secret_...')
                .setValue(this.plugin.settings.notionIntegrationToken || '')
                .onChange(async (value) => {
                    this.plugin.settings.notionIntegrationToken = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(integrationSection)
            .setName('Notion Database IDs')
            .setDesc('Comma-separated list of Notion database IDs')
            .addTextArea(text => text
                .setPlaceholder('database-id-1,database-id-2')
                .setValue((this.plugin.settings.notionDatabaseIds || []).join(','))
                .onChange(async (value) => {
                    this.plugin.settings.notionDatabaseIds = value.split(',').map(id => id.trim()).filter(id => id);
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(integrationSection)
            .setName('Airtable API Key')
            .setDesc('Your Airtable Personal Access Token')
            .addText(text => text
                .setPlaceholder('pat...')
                .setValue(this.plugin.settings.airtableApiKey || '')
                .onChange(async (value) => {
                    this.plugin.settings.airtableApiKey = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(integrationSection)
            .setName('Airtable Base IDs')
            .setDesc('Comma-separated list of Airtable base IDs')
            .addTextArea(text => text
                .setPlaceholder('app...')
                .setValue((this.plugin.settings.airtableBaseIds || []).join(','))
                .onChange(async (value) => {
                    this.plugin.settings.airtableBaseIds = value.split(',').map(id => id.trim()).filter(id => id);
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(integrationSection)
            .setName('Auto Sync')
            .setDesc('Automatically sync external data at regular intervals')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoSync || false)
                .onChange(async (value) => {
                    this.plugin.settings.autoSync = value;
                    await this.plugin.saveData(this.plugin.settings);
                    if (this.plugin.dataIngestionManager?.startAutoSync) {
                        this.plugin.dataIngestionManager.startAutoSync();
                    }
                }));
                
        new Setting(integrationSection)
            .setName('Sync Interval')
            .setDesc('Interval between automatic syncs (in minutes)')
            .addSlider(slider => slider
                .setLimits(5, 1440, 5)
                .setValue(this.plugin.settings.syncInterval || 60)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.syncInterval = value;
                    await this.plugin.saveData(this.plugin.settings);
                    if (this.plugin.dataIngestionManager?.startAutoSync) {
                        this.plugin.dataIngestionManager.startAutoSync();
                    }
                }));
    }

    private createMacroSettings(containerEl: HTMLElement): void {
        const macroSection = containerEl.createDiv({ cls: 'obsidian-ai-settings-section' });
        macroSection.createEl('h3', { text: 'Macros & Prompt Templates', cls: 'obsidian-ai-settings-section-title' });
        
        new Setting(macroSection)
            .setName('Custom Macros')
            .setDesc('Define custom macro commands (JSON array)')
            .addTextArea(text => text
                .setPlaceholder('[{"id":"summarize","name":"Summarize","description":"Summarize text","steps":[...]}]')
                .setValue(JSON.stringify(this.plugin.settings.customMacroCommands || [], null, 2))
                .onChange(async (value) => {
                    try {
                        this.plugin.settings.customMacroCommands = JSON.parse(value);
                        await this.plugin.saveData(this.plugin.settings);
                    } catch (e) {
                        console.error('Invalid JSON for custom macros', e);
                    }
                }));
                
        new Setting(macroSection)
            .setName('Prompt Templates')
            .setDesc('Custom prompt templates (JSON array)')
            .addTextArea(text => text
                .setPlaceholder('[{"id":"qa","name":"Q&A","description":"Answer questions","template":"Answer: {{query}}","variables":["query"],"category":"general"}]')
                .setValue(JSON.stringify(this.plugin.settings.customPromptTemplates || [], null, 2))
                .onChange(async (value) => {
                    try {
                        this.plugin.settings.customPromptTemplates = JSON.parse(value);
                        await this.plugin.saveData(this.plugin.settings);
                    } catch (e) {
                        console.error('Invalid JSON for prompt templates', e);
                    }
                }));
                
        new Setting(macroSection)
            .setName('Custom Tools')
            .setDesc('Enable custom tools')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.customToolsEnabled || false)
                .onChange(async (value) => {
                    this.plugin.settings.customToolsEnabled = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        if (this.plugin.settings.customToolsEnabled) {
            new Setting(macroSection)
                .setName('Custom Tools Configuration')
                .setDesc('Define custom tools (JSON array)')
                .addTextArea(text => text
                    .setPlaceholder('[{"id":"weather","name":"Weather","description":"Get weather","parameters":[...],"category":"utilities"}]')
                    .setValue(this.plugin.settings.customToolsConfig || '[]')
                    .onChange(async (value) => {
                        this.plugin.settings.customToolsConfig = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
        }
    }

    private createMCPSettings(containerEl: HTMLElement): void {
        const mcpSection = containerEl.createDiv({ cls: 'obsidian-ai-settings-section' });
        mcpSection.createEl('h3', { text: 'MCP Services', cls: 'obsidian-ai-settings-section-title' });
        
        new Setting(mcpSection)
            .setName('Enable MCP')
            .setDesc('Enable Model Context Protocol services')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.mcpEnabled || false)
                .onChange(async (value) => {
                    this.plugin.settings.mcpEnabled = value;
                    await this.plugin.saveData(this.plugin.settings);
                    // Refresh to show/hide MCP settings
                    this.display();
                }));
                
        if (this.plugin.settings.mcpEnabled) {
            // MCP Services JSON
            new Setting(mcpSection)
                .setName('MCP Services Configuration')
                .setDesc('Define MCP services (JSON array)')
                .addTextArea(text => text
                    .setPlaceholder('[{"name":"notion","type":"http","enabled":true,"url":"https://..."}]')
                    .setValue(JSON.stringify(this.plugin.settings.mcpServices || [], null, 2))
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.mcpServices = JSON.parse(value);
                            await this.plugin.saveData(this.plugin.settings);
                        } catch (e) {
                            console.error('Invalid JSON for MCP services', e);
                        }
                    }));
                    
            // Individual MCP toggles for common services
            new Setting(mcpSection)
                .setName('Enable Notion MCP')
                .setDesc('Enable Notion integration via MCP')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.notionMcpEnabled || false)
                    .onChange(async (value) => {
                        this.plugin.settings.notionMcpEnabled = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            new Setting(mcpSection)
                .setName('Enable Zapier MCP')
                .setDesc('Enable Zapier integration via MCP')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.zapierMcpEnabled || false)
                    .onChange(async (value) => {
                        this.plugin.settings.zapierMcpEnabled = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
                    
            new Setting(mcpSection)
                .setName('Enable Figma MCP')
                .setDesc('Enable Figma integration via MCP')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.figmaMcpEnabled || false)
                    .onChange(async (value) => {
                        this.plugin.settings.figmaMcpEnabled = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
        }
    }

    private createChatSettings(containerEl: HTMLElement): void {
        const chatSection = containerEl.createDiv({ cls: 'obsidian-ai-settings-section' });
        chatSection.createEl('h3', { text: 'Chat & UI Settings', cls: 'obsidian-ai-settings-section-title' });
        
        new Setting(chatSection)
            .setName('Max Chat History')
            .setDesc('Maximum number of messages to keep in chat history')
            .addSlider(slider => slider
                .setLimits(10, 100, 5)
                .setValue(this.plugin.settings.maxChatHistory || 50)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxChatHistory = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(chatSection)
            .setName('Show Sources')
            .setDesc('Show source information in chat responses')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showSources || false)
                .onChange(async (value) => {
                    this.plugin.settings.showSources = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(chatSection)
            .setName('Stream Responses')
            .setDesc('Stream AI responses as they are generated')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.streamResponses || false)
                .onChange(async (value) => {
                    this.plugin.settings.streamResponses = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        // Performance settings
        new Setting(chatSection)
            .setName('Max Concurrent Requests')
            .setDesc('Maximum number of concurrent API requests')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(this.plugin.settings.maxConcurrentRequests || 3)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxConcurrentRequests = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(chatSection)
            .setName('Request Timeout')
            .setDesc('API request timeout in seconds')
            .addSlider(slider => slider
                .setLimits(10, 300, 10)
                .setValue(this.plugin.settings.requestTimeout || 60)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.requestTimeout = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        new Setting(chatSection)
            .setName('Enable Caching')
            .setDesc('Cache API responses to improve performance')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cacheEnabled || false)
                .onChange(async (value) => {
                    this.plugin.settings.cacheEnabled = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
                
        if (this.plugin.settings.cacheEnabled) {
            new Setting(chatSection)
                .setName('Cache TTL')
                .setDesc('Time to live for cached items in minutes')
                .addSlider(slider => slider
                    .setLimits(1, 1440, 10)
                    .setValue(this.plugin.settings.cacheTTL || 60)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.cacheTTL = value;
                        await this.plugin.saveData(this.plugin.settings);
                    }));
        }
    }

    private createActionButtons(containerEl: HTMLElement): void {
        const actionSection = containerEl.createDiv({ cls: 'obsidian-ai-settings-section' });
        actionSection.createEl('h3', { text: 'Actions', cls: 'obsidian-ai-settings-section-title' });
        
        new Setting(actionSection)
            .setName('Sync External Data')
            .setDesc('Manually sync data from Notion and Airtable')
            .addButton(button => button
                .setButtonText('Sync Now')
                .setCta()
                .onClick(async () => {
                    button.setButtonText('Syncing...');
                    button.setDisabled(true);
                    try {
                        if (this.plugin.dataIngestionManager?.syncExternalData) {
                            await this.plugin.dataIngestionManager.syncExternalData();
                        }
                        button.setButtonText('Sync Complete');
                        setTimeout(() => {
                            button.setButtonText('Sync Now');
                            button.setDisabled(false);
                        }, 2000);
                    } catch (error) {
                        console.error('Sync failed:', error);
                        button.setButtonText('Sync Failed');
                        setTimeout(() => {
                            button.setButtonText('Sync Now');
                            button.setDisabled(false);
                        }, 2000);
                    }
                }));
                
        new Setting(actionSection)
            .setName('Rebuild Embeddings')
            .setDesc('Rebuild all embeddings from scratch')
            .addButton(button => button
                .setButtonText('Rebuild')
                .setWarning()
                .onClick(async () => {
                    button.setButtonText('Rebuilding...');
                    button.setDisabled(true);
                    try {
                        if (this.plugin.embeddingManager?.rebuildEmbeddings) {
                            await this.plugin.embeddingManager.rebuildEmbeddings();
                        }
                        button.setButtonText('Rebuild Complete');
                        setTimeout(() => {
                            button.setButtonText('Rebuild');
                            button.setDisabled(false);
                        }, 2000);
                    } catch (error) {
                        console.error('Rebuild failed:', error);
                        button.setButtonText('Rebuild Failed');
                        setTimeout(() => {
                            button.setButtonText('Rebuild');
                            button.setDisabled(false);
                        }, 2000);
                    }
                }));
    }
}
