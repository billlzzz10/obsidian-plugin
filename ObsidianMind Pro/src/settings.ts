export interface MacroCommand {
    id: string;
    name: string;
    description: string;
    steps: MacroCommandStep[];
}

export interface MacroCommandStep {
    type: 'ai_chat' | 'ai_generate_prompt' | 'ai_tool_use' | 'obsidian_command';
    value: string;
    parameters?: Record<string, any>;
    outputVariable?: string;
    inputVariable?: string;
}

export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    variables: string[];
    category: string;
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    parameters: ToolParameter[];
    handler?: string;
    category: string;
}

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default?: any;
}

export interface AIPluginSettings {
  // AI Model Settings
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

  // External Integration Settings
  notionIntegrationToken: string;
  notionDatabaseIds: string[];
  airtableApiKey: string;
  airtableBaseIds: string[];
  syncInterval: number; // in minutes
  autoSync: boolean;

  // Runtime credentials (Notion-based)
  runtimeCredentialsEnabled: boolean;
  secretsNotionDatabaseId: string;

  // Chat Settings
  maxChatHistory: number;
  showSources: boolean;
  streamResponses: boolean;

  // Advanced Features
  templaterIntegration: boolean;
  mcpEnabled: boolean;
  customToolsEnabled: boolean;
  customToolsConfig: string; // JSON string

  // MCP Services
  mcpServices: MCPServiceConfig[];
  notionMcpEnabled: boolean;
  zapierMcpEnabled: boolean;
  figmaMcpEnabled: boolean;

  // Performance Settings
  maxConcurrentRequests: number;
  requestTimeout: number;
  cacheEnabled: boolean;
  cacheTTL: number; // in minutes
}

export interface CustomModelConfig {
	id: string;
	name: string;
	apiEndpoint: string;
	apiKey: string;
	modelType: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
	maxTokens: number;
	temperature: number;
}

export interface MCPServiceConfig {
	name: string;
	type: 'stdio' | 'http';
	enabled: boolean;
	// For stdio type
	command?: string;
	args?: string[];
	// For http type
	url?: string;
	// Optional headers for HTTP MCP endpoints
	headers?: Record<string, string>;
	// Environment variables
	env?: Record<string, string>;
}

export const DEFAULT_SETTINGS: AIPluginSettings = {
    // AI Model Settings
    selectedModel: 'gpt-4o-mini',
    openaiApiKey: '',
    anthropicApiKey: '',
    googleApiKey: '',
    azureApiKey: '',
    azureEndpoint: 'https://southeastasia.api.cognitive.microsoft.com',
    azureRegion: 'southeastasia',
    customModels: [],

    // Custom Features
    customMacroCommands: [],
    customPromptTemplates: [],
    customTools: [],

    // Azure AI Services Settings
    azureAIServicesEnabled: false,
    azureOpenAIApiKey: '',
    azureOpenAIEndpoint: '',
    azureOpenAIDeploymentName: '',
    azureAISearchApiKey: '',
    azureAISearchEndpoint: '',
    azureAISearchIndexName: '',
    azureAISearchApiVersion: '2023-07-01-Preview',
    azureAgentEnabled: false,
    azureAgentEndpoint: '',
    azureAgentApiKey: '',
    azureAgentName: '',
    azureAgentApiVersion: '2023-05-01',
    azureCosmosDBEnabled: false,
    azureCosmosDBEndpoint: '',
    azureCosmosDBKey: '',
    azureCosmosDBDatabaseId: '',
    azureCosmosDBContainerId: '',

    // Embedding Settings
    embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
    embeddingDimensions: 384,
    chunkSize: 1000,
    chunkOverlap: 200,

    // RAG Settings
    maxRetrievedChunks: 5,
    similarityThreshold: 0.7,
    contextWindowSize: 8000,

    // External Integration Settings
    notionIntegrationToken: '',
    notionDatabaseIds: [],
    airtableApiKey: '',
    airtableBaseIds: [],
    syncInterval: 60, // 1 hour
    autoSync: false,

    // Runtime credentials (Notion-based)
    runtimeCredentialsEnabled: true,
    secretsNotionDatabaseId: '',

    // Chat Settings
    maxChatHistory: 50,
    showSources: true,
    streamResponses: true,

    // Advanced Features
    templaterIntegration: false,
    mcpEnabled: true,
    customToolsEnabled: false,
    customToolsConfig: '[]',

    // MCP Services
    mcpServices: [
        {
            name: 'notion',
            type: 'http',
            enabled: true,
            url: 'https://mcp.notion.com/mcp'
        },
        {
            name: 'zapier',
            type: 'http',
            enabled: false,
            url: 'https://api.zapier.com/v1/mcp/sse'
        },
        {
            name: 'figma',
            type: 'http',
            enabled: false,
            url: 'http://127.0.0.1:3845/sse'
        }
    ],
    notionMcpEnabled: false,
    zapierMcpEnabled: false,
    figmaMcpEnabled: false,

    // Performance Settings
    maxConcurrentRequests: 3,
    requestTimeout: 30000, // 30 seconds
    cacheEnabled: true,
    cacheTTL: 60 // 1 hour
};

