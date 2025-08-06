import { Plugin } from 'obsidian';
import { AIModelConfig, CustomModelConfig } from '../utils/types';
import { SUPPORTED_MODELS } from '../utils/constants';

export class AIModelManager {
    private plugin: Plugin;
    private availableModels: Map<string, AIModelConfig> = new Map();

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async initialize() {
        this.loadSupportedModels();
        this.loadCustomModels();
        console.log('AIModelManager initialized.');
    }

    private loadSupportedModels() {
        // Load OpenAI models
        for (const [id, config] of Object.entries(SUPPORTED_MODELS.OPENAI)) {
            this.availableModels.set(id, {
                id: id,
                name: `OpenAI: ${id}`,
                provider: 'openai',
                apiEndpoint: 'https://api.openai.com/v1/chat/completions',
                maxTokens: config.maxTokens,
                supportsStreaming: config.supportsStreaming,
                supportsFunctionCalling: config.supportsFunctionCalling
            });
        }

        // Load Anthropic models
        for (const [id, config] of Object.entries(SUPPORTED_MODELS.ANTHROPIC)) {
            this.availableModels.set(id, {
                id: id,
                name: `Anthropic: ${id}`,
                provider: 'anthropic',
                apiEndpoint: 'https://api.anthropic.com/v1/messages',
                maxTokens: config.maxTokens,
                supportsStreaming: config.supportsStreaming,
                supportsFunctionCalling: config.supportsFunctionCalling
            });
        }

        // Load Google models
        for (const [id, config] of Object.entries(SUPPORTED_MODELS.GOOGLE)) {
            this.availableModels.set(id, {
                id: id,
                name: `Google: ${id}`,
                provider: 'google',
                apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
                maxTokens: config.maxTokens,
                supportsStreaming: config.supportsStreaming,
                supportsFunctionCalling: config.supportsFunctionCalling
            });
        }
    }

    private loadCustomModels() {
        const customModels: CustomModelConfig[] = this.plugin.settings.customModels;
        for (const model of customModels) {
            this.availableModels.set(model.id, {
                id: model.id,
                name: model.name,
                provider: model.modelType,
                apiEndpoint: model.apiEndpoint,
                maxTokens: model.maxTokens,
                supportsStreaming: true, // Assume custom models support streaming unless specified
                supportsFunctionCalling: false // Assume custom models don't support function calling unless specified
            });
        }
    }

    getAvailableModels(): AIModelConfig[] {
        return Array.from(this.availableModels.values());
    }

    getModelConfig(modelId: string): AIModelConfig | undefined {
        return this.availableModels.get(modelId);
    }

    async addCustomModel(modelConfig: CustomModelConfig): Promise<void> {
        const currentCustomModels = this.plugin.settings.customModels;
        currentCustomModels.push(modelConfig);
        this.plugin.settings.customModels = currentCustomModels;
        await this.plugin.saveSettings();
        this.loadCustomModels(); // Reload all models including the new one
    }

    async removeCustomModel(modelId: string): Promise<void> {
        this.plugin.settings.customModels = this.plugin.settings.customModels.filter(m => m.id !== modelId);
        await this.plugin.saveSettings();
        this.availableModels.delete(modelId); // Remove from in-memory map
        this.loadSupportedModels(); // Reload supported models to ensure they are still there
    }

    async cleanup() {
        this.availableModels.clear();
        console.log('AIModelManager cleaned up.');
    }
}


