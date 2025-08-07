import { Plugin } from 'obsidian';
import { AIModelManager } from '../ai-models/AIModelManager';
import { RAGService } from '../rag/RAGService';
import { ChatMessage, RetrievedSource } from '../utils/types';
import { validateApiKey, createTimeoutSignal } from '../utils/helpers';
import { DEFAULT_REQUEST_TIMEOUT } from '../utils/constants';

interface ChatResponse {
    content: string;
    sources?: RetrievedSource[];
}

export class ChatService {
    private plugin!: Plugin;
    private aiModelManager!: AIModelManager;
    private ragService!: RAGService;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async initialize() {
        this.aiModelManager = this.plugin.aiModelManager;
        this.ragService = this.plugin.ragService;
        console.log('ChatService initialized.');
    }

    async sendMessage(userMessage: string): Promise<ChatResponse> {
        const selectedModel = this.plugin.settings.selectedModel;
        const modelConfig = this.aiModelManager.getModelConfig(selectedModel);

        if (!modelConfig) {
            throw new Error(`Model ${selectedModel} not found`);
        }

        // Validate API key for the selected provider
        const apiKey = this.getApiKeyForProvider(modelConfig.provider);
        if (!validateApiKey(apiKey, modelConfig.provider)) {
            throw new Error(`Invalid or missing API key for ${modelConfig.provider}`);
        }

        // Get RAG context
        const ragResult = await this.ragService.performRAG(userMessage);
        
        // Create prompt with RAG context
        const prompt = await this.ragService.createRAGPrompt(userMessage);

        // Send to AI model
        const aiResponse = await this.callAIModel(modelConfig, prompt, apiKey);

        return {
            content: aiResponse,
            sources: ragResult.sources
        };
    }

    private getApiKeyForProvider(provider: string): string {
        switch (provider) {
            case 'openai':
                return this.plugin.settings.openaiApiKey;
            case 'anthropic':
                return this.plugin.settings.anthropicApiKey;
            case 'google':
                return this.plugin.settings.googleApiKey;
            default:
                // For custom models, we might need to store API keys differently
                return '';
        }
    }

    private async callAIModel(modelConfig: any, prompt: string, apiKey: string): Promise<string> {
        switch (modelConfig.provider) {
            case 'openai':
                return this.callOpenAI(modelConfig, prompt, apiKey);
            case 'anthropic':
                return this.callAnthropic(modelConfig, prompt, apiKey);
            case 'google':
                return this.callGoogle(modelConfig, prompt, apiKey);
            default:
                throw new Error(`Unsupported provider: ${modelConfig.provider}`);
        }
    }

    private async callOpenAI(modelConfig: any, prompt: string, apiKey: string): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelConfig.id,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: Math.min(4000, modelConfig.maxTokens),
                temperature: 0.7,
                stream: false // For now, disable streaming
            }),
            signal: createTimeoutSignal(DEFAULT_REQUEST_TIMEOUT)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response generated';
    }

    private async callAnthropic(modelConfig: any, prompt: string, apiKey: string): Promise<string> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: modelConfig.id,
                max_tokens: Math.min(4000, modelConfig.maxTokens),
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7
            }),
            signal: createTimeoutSignal(DEFAULT_REQUEST_TIMEOUT)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.content[0]?.text || 'No response generated';
    }

    private async callGoogle(modelConfig: any, prompt: string, apiKey: string): Promise<string> {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelConfig.id}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: Math.min(4000, modelConfig.maxTokens)
                }
            }),
            signal: createTimeoutSignal(DEFAULT_REQUEST_TIMEOUT)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Google AI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
    }

    async cleanup() {
        console.log('ChatService cleaned up.');
    }
}

