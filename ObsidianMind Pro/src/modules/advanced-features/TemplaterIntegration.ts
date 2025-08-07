import { Plugin, TFile } from 'obsidian';
import { RAGService } from '../rag/RAGService';
import { ChatService } from '../chat/ChatService';

export class TemplaterIntegration {
    private plugin!: Plugin;
    private ragService!: RAGService;
    private chatService!: ChatService;
    private isTemplaterAvailable = false;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async initialize() {
        // Check if Templater plugin is available
        this.isTemplaterAvailable = this.checkTemplaterAvailability();

        if (this.isTemplaterAvailable) {
            this.registerTemplaterFunctions();
            console.log('Templater integration initialized.');
        } else {
            console.log('Templater plugin not found. Integration disabled.');
        }

        // Set references to other services
        this.ragService = this.plugin.ragService;
        this.chatService = this.plugin.chatService;
    }

    private checkTemplaterAvailability(): boolean {
        // Check if Templater plugin is installed and enabled
        const templaterPlugin = (this.plugin.app as any).plugins.plugins['templater-obsidian'];
        return templaterPlugin && templaterPlugin.enabled;
    }

    private registerTemplaterFunctions() {
        if (!this.isTemplaterAvailable) return;

        try {
            const templaterPlugin = (this.plugin.app as any).plugins.plugins['templater-obsidian'];

            // Register AI functions for Templater
            templaterPlugin.templater.functions_generator.user_functions.set('ai_chat', this.aiChat.bind(this));
            templaterPlugin.templater.functions_generator.user_functions.set('ai_search', this.aiSearch.bind(this));
            templaterPlugin.templater.functions_generator.user_functions.set('ai_summarize', this.aiSummarize.bind(this));
            templaterPlugin.templater.functions_generator.user_functions.set('ai_generate_content', this.aiGenerateContent.bind(this));
            templaterPlugin.templater.functions_generator.user_functions.set('ai_extract_info', this.aiExtractInfo.bind(this));

            console.log('AI functions registered with Templater.');
        } catch (error) {
            console.error('Failed to register Templater functions:', error);
        }
    }

    // Templater function: AI Chat
    async aiChat(prompt: string): Promise<string> {
        try {
            const response = await this.chatService.sendMessage(prompt);
            return response.content;
        } catch (error) {
            console.error('AI Chat error:', error);
            return `Error: ${(error as Error).message}`;
        }
    }

    // Templater function: AI Search
    async aiSearch(query: string, maxResults: number = 5): Promise<string> {
        try {
            const sources = await this.ragService.getRelevantSources(query, maxResults);

            if (sources.length === 0) {
                return 'No relevant sources found.';
            }

            let result = `Found ${sources.length} relevant sources:\n\n`;
            sources.forEach((source, index) => {
                result += `${index + 1}. **${source.title}** (${Math.round(source.similarity * 100)}% match)\n`;
                result += `   ${source.content.substring(0, 200)}...\n\n`;
            });

            return result;
        } catch (error) {
            console.error('AI Search error:', error);
            return `Error: ${(error as Error).message}`;
        }
    }

    // Templater function: AI Summarize
    async aiSummarize(content: string, maxLength: number = 200): Promise<string> {
        try {
            const prompt = `Please summarize the following content in approximately ${maxLength} words:\n\n${content}`;
            const response = await this.chatService.sendMessage(prompt);
            return response.content;
        } catch (error) {
            console.error('AI Summarize error:', error);
            return `Error: ${(error as Error).message}`;
        }
    }

    // Templater function: AI Generate Content
    async aiGenerateContent(topic: string, type: string = 'paragraph', length: string = 'medium'): Promise<string> {
        try {
            let prompt = `Generate a ${type} about "${topic}".`;

            switch (length) {
                case 'short':
                    prompt += ' Keep it brief and concise.';
                    break;
                case 'long':
                    prompt += ' Provide detailed and comprehensive content.';
                    break;
                default:
                    prompt += ' Use a moderate length.';
            }

            // Use RAG to get relevant context
            const context = await this.ragService.getContextForPrompt(topic, 2000);
            if (context) {
                prompt += `\n\nRelevant context from your knowledge base:\n${context}`;
            }

            const response = await this.chatService.sendMessage(prompt);
            return response.content;
        } catch (error) {
            console.error('AI Generate Content error:', error);
            return `Error: ${(error as Error).message}`;
        }
    }

    // Templater function: AI Extract Information
    async aiExtractInfo(content: string, infoType: string): Promise<string> {
        try {
            const prompt = `Extract ${infoType} from the following content:\n\n${content}`;
            const response = await this.chatService.sendMessage(prompt);
            return response.content;
        } catch (error) {
            console.error('AI Extract Info error:', error);
            return `Error: ${(error as Error).message}`;
        }
    }

    // Helper function to create AI-powered templates
    async createAITemplate(templateName: string, templateContent: string): Promise<void> {
        if (!this.isTemplaterAvailable) {
            throw new Error('Templater plugin is not available');
        }

        try {
            const templatesFolder = this.plugin.app.vault.getAbstractFileByPath('Templates');
            if (!templatesFolder) {
                await this.plugin.app.vault.createFolder('Templates');
            }

            const templatePath = `Templates/${templateName}.md`;
            await this.plugin.app.vault.create(templatePath, templateContent);

            console.log(`AI template created: ${templatePath}`);
        } catch (error) {
            console.error('Failed to create AI template:', error);
            throw error;
        }
    }

    // Get available AI functions for Templater
    getAvailableFunctions(): string[] {
        return [
            'ai_chat(prompt)',
            'ai_search(query, maxResults)',
            'ai_summarize(content, maxLength)',
            'ai_generate_content(topic, type, length)',
            'ai_extract_info(content, infoType)'
        ];
    }

    async cleanup() {
        // Cleanup is handled automatically when the plugin is disabled
        console.log('TemplaterIntegration cleaned up.');
    }
}

