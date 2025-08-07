import { PromptTemplate, MacroCommand, CustomTool } from "./modules/utils/types";

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

  // Chat Settings
  maxChatHistory: number;
  showSources: boolean;
  streamResponses: boolean;

  // Advanced Features
  templaterIntegration: boolean;
  mcpEnabled: boolean;
  customToolsEnabled: boolean;
  customToolsConfig: string; // JSON string
  customPromptTemplates: PromptTemplate[];
  customMacroCommands: MacroCommand[];
  customTools: CustomTool[];

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
	
	// Chat Settings
	maxChatHistory: 50,
	showSources: true,
	streamResponses: true,
	
	// Advanced Features
	templaterIntegration: false,
	mcpEnabled: false,
	customToolsEnabled: false,
	customToolsConfig: '[]',
	customPromptTemplates: [],
	customMacroCommands: [],
	customTools: [],
	
	// MCP Services
	mcpServices: [
		{
			name: 'notion',
			type: 'stdio',
			enabled: false,
			command: 'npx',
			args: ['-y', '@notionhq/notion-mcp-server@latest'],
			env: {
				'OPENAPI_MCP_HEADERS': '{"Authorization": "Bearer ${NOTION_TOKEN}", "Notion-Version": "2022-06-28"}'
			}
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
	cacheTTL: 60, // 1 hour
};

