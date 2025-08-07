import { Plugin } from 'obsidian';
import { AzureTranslatorService } from '../ai-models/AzureTranslatorService';

// ตัวเลือกการตั้งค่าสำหรับ Azure AI Services
export interface AzureAIServiceConfig {
    // Azure OpenAI
    openaiApiKey: string;
    openaiEndpoint: string;
    openaiDeploymentName: string;

    // Azure AI Search
    searchApiKey: string;
    searchEndpoint: string;
    searchIndexName: string;

    // Azure Translator
    translatorApiKey: string;
    translatorEndpoint: string;
    translatorRegion: string;
}

// คลาสหลักสำหรับ Azure AI Services
export class AzureAIService {
    private plugin: Plugin;
    private config: AzureAIServiceConfig;
    private translatorService: AzureTranslatorService | null = null;

    constructor(plugin: Plugin, config: AzureAIServiceConfig) {
        this.plugin = plugin;
        this.config = config;
    }

    async initialize() {
        // สร้าง Azure Translator Service ถ้ามีการตั้งค่า
        if (this.config.translatorApiKey && this.config.translatorEndpoint && this.config.translatorRegion) {
            this.translatorService = new AzureTranslatorService(this.plugin, {
                apiKey: this.config.translatorApiKey,
                endpoint: this.config.translatorEndpoint,
                region: this.config.translatorRegion
            });
        }

        console.log('AzureAIService initialized.');
    }

    // สำหรับเรียกใช้ Azure Translator Service
    getTranslatorService(): AzureTranslatorService {
        if (!this.translatorService) {
            throw new Error('Azure Translator Service is not initialized. Please check your configuration.');
        }
        return this.translatorService;
    }

    // ตรวจสอบว่ามีการตั้งค่าสำหรับบริการที่กำหนดหรือไม่
    hasTranslatorConfig(): boolean {
        return !!(this.config.translatorApiKey && this.config.translatorEndpoint && this.config.translatorRegion);
    }

    hasOpenAIConfig(): boolean {
        return !!(this.config.openaiApiKey && this.config.openaiEndpoint && this.config.openaiDeploymentName);
    }

    hasSearchConfig(): boolean {
        return !!(this.config.searchApiKey && this.config.searchEndpoint && this.config.searchIndexName);
    }

    // อัปเดตการตั้งค่า
    updateConfig(config: Partial<AzureAIServiceConfig>): void {
        this.config = { ...this.config, ...config };
    }
}
