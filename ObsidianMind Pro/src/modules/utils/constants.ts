// Constants for the AI plugin

export const PLUGIN_NAME = 'Obsidian AI with RAG & Embedding';
export const PLUGIN_VERSION = '1.0.0';

// Database and storage constants
export const VECTOR_STORE_NAME = 'ai-plugin-vectors';
export const CACHE_STORE_NAME = 'ai-plugin-cache';
export const SETTINGS_STORE_NAME = 'ai-plugin-settings';

// Embedding constants
export const DEFAULT_EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
export const DEFAULT_EMBEDDING_DIMENSIONS = 384;
export const MAX_CHUNK_SIZE = 2000;
export const MIN_CHUNK_SIZE = 100;
export const DEFAULT_CHUNK_SIZE = 1000;
export const DEFAULT_CHUNK_OVERLAP = 200;

// RAG constants
export const MAX_RETRIEVED_CHUNKS = 10;
export const MIN_SIMILARITY_THRESHOLD = 0.1;
export const MAX_SIMILARITY_THRESHOLD = 1.0;
export const DEFAULT_SIMILARITY_THRESHOLD = 0.7;
export const MAX_CONTEXT_WINDOW = 32000;
export const DEFAULT_CONTEXT_WINDOW = 8000;

// API constants
export const OPENAI_API_BASE = 'https://api.openai.com/v1';
export const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
export const GOOGLE_AI_API_BASE = 'https://generativelanguage.googleapis.com/v1';
export const AZURE_TRANSLATOR_API_BASE = 'https://api.cognitive.microsoft.com/translator/text/v3.0';
export const NOTION_API_BASE = 'https://api.notion.com/v1';
export const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

// Request timeouts (in milliseconds)
export const DEFAULT_REQUEST_TIMEOUT = 30000;
export const EMBEDDING_REQUEST_TIMEOUT = 60000;
export const SYNC_REQUEST_TIMEOUT = 120000;

// Cache settings
export const DEFAULT_CACHE_TTL = 3600000; // 1 hour in milliseconds
export const MAX_CACHE_SIZE = 100; // Maximum number of cached items

// Sync settings
export const MIN_SYNC_INTERVAL = 5; // 5 minutes
export const MAX_SYNC_INTERVAL = 1440; // 24 hours
export const DEFAULT_SYNC_INTERVAL = 60; // 1 hour

// Chat settings
export const MAX_CHAT_HISTORY = 100;
export const DEFAULT_MAX_CHAT_HISTORY = 50;
export const MAX_MESSAGE_LENGTH = 10000;

// File and content limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_CONTENT_LENGTH = 100000; // 100,000 characters
export const MAX_NOTES_PROCESSED = 1000;

// UI constants
export const CHAT_VIEW_TYPE = 'ai-chat-view';
export const SETTINGS_TAB_ID = 'ai-plugin-settings';

// Error codes
export const ERROR_CODES = {
    INITIALIZATION_FAILED: 'INIT_FAILED',
    API_KEY_MISSING: 'API_KEY_MISSING',
    API_REQUEST_FAILED: 'API_REQUEST_FAILED',
    EMBEDDING_FAILED: 'EMBEDDING_FAILED',
    VECTOR_STORE_ERROR: 'VECTOR_STORE_ERROR',
    SYNC_FAILED: 'SYNC_FAILED',
    INVALID_CONFIGURATION: 'INVALID_CONFIG',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// Model configurations
export const SUPPORTED_MODELS = {
    OPENAI: {
        'gpt-4o': { maxTokens: 128000, supportsStreaming: true, supportsFunctionCalling: true },
        'gpt-4o-mini': { maxTokens: 128000, supportsStreaming: true, supportsFunctionCalling: true },
        'gpt-4-turbo': { maxTokens: 128000, supportsStreaming: true, supportsFunctionCalling: true },
        'gpt-3.5-turbo': { maxTokens: 16385, supportsStreaming: true, supportsFunctionCalling: true }
    },
    ANTHROPIC: {
        'claude-3-5-sonnet-20241022': { maxTokens: 200000, supportsStreaming: true, supportsFunctionCalling: true },
        'claude-3-haiku-20240307': { maxTokens: 200000, supportsStreaming: true, supportsFunctionCalling: true },
        'claude-3-opus-20240229': { maxTokens: 200000, supportsStreaming: true, supportsFunctionCalling: true }
    },
    GOOGLE: {
        'gemini-1.5-pro': { maxTokens: 2097152, supportsStreaming: true, supportsFunctionCalling: true },
        'gemini-1.5-flash': { maxTokens: 1048576, supportsStreaming: true, supportsFunctionCalling: true }
    },
    AZURE: {
        'azure-translator': { maxTokens: 50000, supportsStreaming: false, supportsFunctionCalling: false },
        'azure-gpt-4': { maxTokens: 128000, supportsStreaming: true, supportsFunctionCalling: true },
        'azure-gpt-35-turbo': { maxTokens: 16385, supportsStreaming: true, supportsFunctionCalling: true }
    }
} as const;

// Embedding model configurations
export const EMBEDDING_MODELS = {
    'sentence-transformers/all-MiniLM-L6-v2': {
        dimensions: 384,
        maxSequenceLength: 256,
        size: '22MB'
    },
    'sentence-transformers/all-mpnet-base-v2': {
        dimensions: 768,
        maxSequenceLength: 384,
        size: '420MB'
    }
} as const;

