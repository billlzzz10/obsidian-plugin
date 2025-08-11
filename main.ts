import { Plugin } from 'obsidian';
import { AIPluginSettingTab } from './src/ui/SettingsTab';
import { AIModelManager, SettingsShape } from './src/managers/AIModelManager';
import { EmbeddingManager, EmbeddingSettingsShape, InMemoryVectorStore } from './src/managers/EmbeddingManager';
import { BackendClient } from './src/managers/BackendClient';

// --- DataIngestionManager stub (kept minimal) ---
class DataIngestionManager {
  async startAutoSync() { return Promise.resolve(); }
  async syncExternalData() { return Promise.resolve(); }
}

// --- MCP Services stub ---
class MCPManager {
  constructor(private getSettings: () => PluginSettings) {}
  async init() { /* wire MCP services by settings.mcpServices */ return Promise.resolve(); }
}

export type PluginSettings = SettingsShape & EmbeddingSettingsShape & {
  // Backend
  backendUrl?: string;
  apiKey?: string;
  // Provider-specific
  googleApiKey?: string;
  azureRegion?: string;
  // Azure services
  azureAIServicesEnabled?: boolean;
  azureAISearchApiKey?: string;
  azureAISearchEndpoint?: string;
  azureAISearchIndexName?: string;
  azureAISearchApiVersion?: string;
  azureAgentEnabled?: boolean;
  azureAgentEndpoint?: string;
  azureAgentApiKey?: string;
  azureAgentName?: string;
  azureAgentApiVersion?: string;
  azureCosmosDBEnabled?: boolean;
  azureCosmosDBEndpoint?: string;
  azureCosmosDBKey?: string;
  azureCosmosDBDatabaseId?: string;
  azureCosmosDBContainerId?: string;
  // RAG
  chunkSize?: number;
  chunkOverlap?: number;
  maxRetrievedChunks?: number;
  similarityThreshold?: number;
  ragEnabled?: boolean;
  // Integrations
  notionIntegrationToken?: string;
  notionDatabaseIds?: string[];
  airtableApiKey?: string;
  airtableBaseIds?: string[];
  syncInterval?: number;
  autoSync?: boolean;
  // Chat/UI
  maxChatHistory?: number;
  showSources?: boolean;
  // Advanced
  templaterIntegration?: boolean;
  mcpEnabled?: boolean;
  customToolsEnabled?: boolean;
  customToolsConfig?: string;
  customMacroCommands?: Array<Record<string, unknown>>;
  customPromptTemplates?: Array<Record<string, unknown>>;
  mcpServices?: Array<Record<string, unknown>>;
  notionMcpEnabled?: boolean;
  zapierMcpEnabled?: boolean;
  figmaMcpEnabled?: boolean;
  // Performance
  maxConcurrentRequests?: number;
  requestTimeout?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
};

const DEFAULT_SETTINGS: PluginSettings = {
  // Backend
  backendUrl: 'http://localhost:8000',
  apiKey: '',
  // Provider
  aiProvider: 'openai',
  selectedModel: 'gpt-3.5-turbo',
  openaiApiKey: '',
  anthropicApiKey: '',
  googleApiKey: '',
  azureApiKey: '',
  azureEndpoint: '',
  azureOpenAIDeploymentName: '',
  azureApiVersion: '2023-05-15',
  streamResponses: false,
  // Azure extras
  azureRegion: '',
  azureAIServicesEnabled: false,
  azureAISearchApiKey: '',
  azureAISearchEndpoint: '',
  azureAISearchIndexName: '',
  azureAISearchApiVersion: '2023-07-01-Preview',
  azureAgentEnabled: false,
  azureAgentEndpoint: '',
  azureAgentApiKey: '',
  azureAgentName: '',
  azureAgentApiVersion: '',
  azureCosmosDBEnabled: false,
  azureCosmosDBEndpoint: '',
  azureCosmosDBKey: '',
  azureCosmosDBDatabaseId: '',
  azureCosmosDBContainerId: '',
  // Embeddings/RAG
  embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
  embeddingDimensions: 384,
  chunkSize: 500,
  chunkOverlap: 100,
  maxRetrievedChunks: 5,
  similarityThreshold: 0.7,
  ragEnabled: true,
  // Integrations
  notionIntegrationToken: '',
  notionDatabaseIds: [],
  airtableApiKey: '',
  airtableBaseIds: [],
  syncInterval: 60,
  autoSync: false,
  // Chat/UI
  maxChatHistory: 50,
  showSources: false,
  // Advanced / MCP
  templaterIntegration: false,
  mcpEnabled: false,
  customToolsEnabled: false,
  customToolsConfig: '[]',
  customMacroCommands: [],
  customPromptTemplates: [],
  mcpServices: [],
  notionMcpEnabled: false,
  zapierMcpEnabled: false,
  figmaMcpEnabled: false,
  // Perf
  maxConcurrentRequests: 3,
  requestTimeout: 60,
  cacheEnabled: false,
  cacheTTL: 60,
};

export default class AIEnhancedPlugin extends Plugin {
  settings!: PluginSettings;

  dataIngestionManager!: DataIngestionManager;
  embeddingManager!: EmbeddingManager;
  aiModelManager!: AIModelManager;
  mcpManager!: MCPManager;
  backendClient!: BackendClient;

  async onload() {
  const loaded = (await this.loadData()) || {};
  this.settings = { ...DEFAULT_SETTINGS, ...loaded };

  this.dataIngestionManager = new DataIngestionManager();
  this.backendClient = new BackendClient(() => this.settings);
  this.embeddingManager = new EmbeddingManager(() => this.settings, new InMemoryVectorStore(), this.backendClient);
  this.aiModelManager = new AIModelManager(() => this.settings, this.backendClient);
  this.mcpManager = new MCPManager(() => this.settings);
  await this.mcpManager.init();

  this.addSettingTab(new AIPluginSettingTab(this.app, this));
  }

  async saveData(data: PluginSettings) {
    this.settings = data;
    await super.saveData(data);
  }
}
