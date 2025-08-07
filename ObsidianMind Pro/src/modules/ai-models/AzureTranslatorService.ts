import { Plugin } from 'obsidian';

export interface AzureTranslatorConfig {
    apiKey: string;
    endpoint: string;
    region: string;
}

export interface TranslationRequest {
    text: string;
    from?: string;
    to: string;
}

export interface TranslationResult {
    translatedText: string;
    detectedLanguage?: string;
    confidence?: number;
}

export class AzureTranslatorService {
    private plugin: Plugin;
    private config: AzureTranslatorConfig;

    constructor(plugin: Plugin, config: AzureTranslatorConfig) {
        this.plugin = plugin;
        this.config = config;
    }

    async translateText(request: TranslationRequest): Promise<TranslationResult> {
        try {
            const url = new URL('/translate', this.config.endpoint);
            url.searchParams.append('api-version', '3.0');
            url.searchParams.append('to', request.to);

            if (request.from) {
                url.searchParams.append('from', request.from);
            }

            const headers = {
                'Ocp-Apim-Subscription-Key': this.config.apiKey,
                'Ocp-Apim-Subscription-Region': this.config.region,
                'Content-Type': 'application/json'
            };

            const body = JSON.stringify([{ text: request.text }]);

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: headers,
                body: body
            });

            if (!response.ok) {
                throw new Error(`Azure Translator API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (!result || !result[0] || !result[0].translations || !result[0].translations[0]) {
                throw new Error('Invalid response from Azure Translator API');
            }

            const translation = result[0].translations[0];
            const detectedLanguage = result[0].detectedLanguage;

            return {
                translatedText: translation.text,
                detectedLanguage: detectedLanguage?.language,
                confidence: detectedLanguage?.score
            };
        } catch (error) {
            console.error('Azure Translator error:', error);
            throw error;
        }
    }

    async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
        try {
            const url = new URL('/detect', this.config.endpoint);
            url.searchParams.append('api-version', '3.0');

            const headers = {
                'Ocp-Apim-Subscription-Key': this.config.apiKey,
                'Ocp-Apim-Subscription-Region': this.config.region,
                'Content-Type': 'application/json'
            };

            const body = JSON.stringify([{ text: text }]);

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: headers,
                body: body
            });

            if (!response.ok) {
                throw new Error(`Azure Translator API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (!result || !result[0]) {
                throw new Error('Invalid response from Azure Language Detection API');
            }

            return {
                language: result[0].language,
                confidence: result[0].score
            };
        } catch (error) {
            console.error('Azure Language Detection error:', error);
            throw error;
        }
    }

    async getSupportedLanguages(): Promise<Record<string, { name: string; nativeName: string }>> {
        try {
            const url = new URL('/languages', this.config.endpoint);
            url.searchParams.append('api-version', '3.0');
            url.searchParams.append('scope', 'translation');

            const response = await fetch(url.toString(), {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Azure Translator API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result.translation || {};
        } catch (error) {
            console.error('Azure Supported Languages error:', error);
            throw error;
        }
    }

    async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
        try {
            const results: TranslationResult[] = [];

            // Azure Translator supports batch requests, but for simplicity, we'll do them one by one
            // In production, you might want to implement proper batch processing
            for (const request of requests) {
                const result = await this.translateText(request);
                results.push(result);
            }

            return results;
        } catch (error) {
            console.error('Azure Batch Translation error:', error);
            throw error;
        }
    }

    updateConfig(config: Partial<AzureTranslatorConfig>): void {
        this.config = { ...this.config, ...config };
    }

    isConfigured(): boolean {
        return !!(this.config.apiKey && this.config.endpoint && this.config.region);
    }
}
