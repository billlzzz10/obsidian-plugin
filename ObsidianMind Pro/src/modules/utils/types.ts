import { TFile } from "obsidian";
import { AIPluginSettings } from "../../settings";

export interface ObsidianNote {
    path: string;
    name: string;
    content: string;
    frontmatter: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
}

export interface NotionPage {
    id: string;
    title: string;
    content: string;
    properties: any;
    url: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AirtableRecord {
    id: string;
    fields: Record<string, any>;
    baseId: string;
    tableId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface EmbeddingVector {
    id: string;
    vector: number[];
    content: string;
    metadata: {
        sourceType: "obsidian" | "notion" | "airtable";
        sourceId: string;
        title: string;
        path?: string; // For Obsidian notes
        tags?: string[]; // For Obsidian notes
        createdAt: Date;
        updatedAt: Date;
        chunkIndex: number;
        totalChunks: number;
    };
}

export interface RetrievedSource {
    id: string;
    content: string;
    title: string;
    path?: string;
    sourceType: "obsidian" | "notion" | "airtable";
    sourceId: string;
    similarity: number;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    sources?: RetrievedSource[];
}

export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    variables: string[];
    category: string;
}

export interface MacroCommand {
    id: string;
    name: string;
    description: string;
    steps: MacroCommandStep[];
}

export interface MacroCommandStep {
    type: "ai_chat" | "ai_generate_prompt" | "ai_tool_use" | "obsidian_command";
    value: string; // For ai_chat: prompt, for ai_generate_prompt: templateId, for ai_tool_use: toolId, for obsidian_command: commandId
    parameters?: Record<string, any>; // For ai_generate_prompt, ai_tool_use
    outputVariable?: string; // Variable to store the output of the step
    inputVariable?: string; // Variable to use as input for the step
}

export class PluginError extends Error {
    code: ERROR_CODES;

    constructor(message: string, code: ERROR_CODES) {
        super(message);
        this.name = "PluginError";
        this.code = code;
    }
}

export enum ERROR_CODES {
    API_KEY_MISSING = "API_KEY_MISSING",
    API_ERROR = "API_ERROR",
    MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
    EMBEDDING_FAILED = "EMBEDDING_FAILED",
    RAG_FAILED = "RAG_FAILED",
    NOTION_API_ERROR = "NOTION_API_ERROR",
    AIRTABLE_API_ERROR = "AIRTABLE_API_ERROR",
    INVALID_SETTINGS = "INVALID_SETTINGS",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    TEMPLATER_NOT_AVAILABLE = "TEMPLATER_NOT_AVAILABLE",
    TOOL_EXECUTION_FAILED = "TOOL_EXECUTION_FAILED",
    MACRO_EXECUTION_FAILED = "MACRO_EXECUTION_FAILED",
    OBSIDIAN_API_ERROR = "OBSIDIAN_API_ERROR",
}

export interface RAGQuery {
    text?: string;
    query?: string;
    maxResults?: number;
    threshold?: number;
    similarityThreshold?: number;
    sourceTypes?: ('obsidian' | 'notion' | 'airtable')[];
    filters?: any;
}

export interface SyncStatus {
    isRunning: boolean;
    progress: number;
    status: string;
    lastSyncTime?: Date;
    errors?: string[];
    sourceType?: string;
    lastSync?: Date;
    itemsProcessed?: number;
    totalItems?: number;
}

export interface CustomTool {
    id: string;
    name: string;
    description: string;
    schema: Record<string, any>;
    handler: string; // JavaScript code or URL
}

export interface AIModelConfig {
    id: string;
    name: string;
    provider: string;
    modelName?: string;
    maxTokens: number;
    temperature?: number;
    apiEndpoint?: string;
    supportsStreaming?: boolean;
    supportsFunctionCalling?: boolean;
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


