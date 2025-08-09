import './global.d.ts';
import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { AIPluginSettings, DEFAULT_SETTINGS } from './settings';
import { AIPluginSettingTab } from './ui/SettingsTab';
import { ChatView, VIEW_TYPE_CHAT } from './ui/ChatView';
import { DataIngestionManager } from './modules/data-ingestion/DataIngestionManager';
import { EmbeddingManager } from './modules/embedding/EmbeddingManager';
import { RAGService } from './modules/rag/RAGService';
import { AIModelManager } from './modules/ai-models/AIModelManager';
import { AzureTranslatorService } from './modules/ai-models/AzureTranslatorService';
import { ChatService } from './modules/chat/ChatService';
import { AdvancedFeaturesManager } from './modules/advanced-features/AdvancedFeaturesManager';
import { MCPServiceManager } from './modules/advanced-features/MCPServiceManager';
import { AzureAIService } from './modules/azure-services/AzureAIService';
import { AzureAgentService } from './modules/azure-services/AzureAgentService';
import { AzureAISearchService } from './modules/azure-services/AzureAISearchService';
import { AzureCosmosDBService } from './modules/azure-services/AzureCosmosDBService';
import { CredentialsResolver } from './modules/advanced-features/CredentialsResolver';

export default class AIPlugin extends Plugin {
    settings: AIPluginSettings = DEFAULT_SETTINGS;
    dataIngestionManager!: DataIngestionManager;
    embeddingManager!: EmbeddingManager;
    ragService!: RAGService;
    aiModelManager!: AIModelManager;
    azureTranslatorService!: AzureTranslatorService;
    chatService!: ChatService;
    advancedFeaturesManager!: AdvancedFeaturesManager;
    mcpServiceManager!: MCPServiceManager;
    credentialsResolver!: CredentialsResolver;

    // Azure Services
    azureAIService!: AzureAIService;
    azureAgentService!: AzureAgentService;
    azureAISearchService!: AzureAISearchService;
    azureCosmosDBService!: AzureCosmosDBService;

    async onload() {
        console.log('Loading Obsidian AI Plugin...');

        await this.loadSettings();

        // Initialize managers and services
        this.dataIngestionManager = new DataIngestionManager(this);
        this.embeddingManager = new EmbeddingManager(this);
        this.ragService = new RAGService(this, this.embeddingManager, this.embeddingManager.vectorStore);
        this.aiModelManager = new AIModelManager(this);
        this.azureTranslatorService = new AzureTranslatorService(this, {
            apiKey: this.settings.azureApiKey,
            endpoint: this.settings.azureEndpoint,
            region: this.settings.azureRegion
        });
        this.chatService = new ChatService(this);
        this.advancedFeaturesManager = new AdvancedFeaturesManager(this);
        this.mcpServiceManager = new MCPServiceManager(this);
        this.credentialsResolver = new CredentialsResolver(this);

        // Warmup credentials cache if enabled
        try { await this.credentialsResolver.warmup(false); } catch (e) { console.debug('credentialsResolver warmup failed', e); }

        // Initialize Azure services
        if (this.settings.azureAIServicesEnabled) {
            console.log('Initializing Azure AI Services...');

            // Initialize AzureAIService
            this.azureAIService = new AzureAIService(this, {
                openaiApiKey: this.settings.azureOpenAIApiKey,
                openaiEndpoint: this.settings.azureOpenAIEndpoint,
                openaiDeploymentName: this.settings.azureOpenAIDeploymentName,
                searchApiKey: this.settings.azureAISearchApiKey,
                searchEndpoint: this.settings.azureAISearchEndpoint,
                searchIndexName: this.settings.azureAISearchIndexName,
                translatorApiKey: this.settings.azureApiKey,
                translatorEndpoint: this.settings.azureEndpoint,
                translatorRegion: this.settings.azureRegion
            });
            await this.azureAIService.initialize();

            // Initialize AzureAgentService if enabled
            if (this.settings.azureAgentEnabled) {
                this.azureAgentService = new AzureAgentService(this, {
                    endpoint: this.settings.azureAgentEndpoint,
                    apiKey: this.settings.azureAgentApiKey,
                    agentName: this.settings.azureAgentName,
                    apiVersion: this.settings.azureAgentApiVersion
                });
                await this.azureAgentService.initialize();
            }

            // Initialize AzureAISearchService if configured
            if (this.settings.azureAISearchApiKey && this.settings.azureAISearchEndpoint) {
                this.azureAISearchService = new AzureAISearchService(this, {
                    endpoint: this.settings.azureAISearchEndpoint,
                    apiKey: this.settings.azureAISearchApiKey,
                    indexName: this.settings.azureAISearchIndexName,
                    apiVersion: this.settings.azureAISearchApiVersion
                });
                await this.azureAISearchService.initialize();
            }

            // Initialize AzureCosmosDBService if enabled
            if (this.settings.azureCosmosDBEnabled) {
                this.azureCosmosDBService = new AzureCosmosDBService(this, {
                    endpoint: this.settings.azureCosmosDBEndpoint,
                    key: this.settings.azureCosmosDBKey,
                    databaseId: this.settings.azureCosmosDBDatabaseId,
                    containerId: this.settings.azureCosmosDBContainerId
                });
                await this.azureCosmosDBService.initialize();
            }
        }

        await this.dataIngestionManager.initialize();
        await this.embeddingManager.initialize();
        this.embeddingManager.setDataIngestionManager(this.dataIngestionManager); // Pass DataIngestionManager reference
        await this.ragService.initialize();
        await this.aiModelManager.initialize();
        await this.chatService.initialize();
        await this.advancedFeaturesManager.initialize();

        // Start MCP services (HTTP/stdio) if enabled
        if (this.settings.mcpEnabled && this.mcpServiceManager) {
            for (const svc of this.settings.mcpServices) {
                if (!svc.enabled) continue;
                // Inject Authorization header for Notion HTTP MCP using the Notion Integration Token set in settings
                const isNotion = svc.type === 'http' && svc.name.toLowerCase() === 'notion';
                if (isNotion) {
                    if (!this.settings.notionIntegrationToken) {
                        console.warn('Notion MCP is enabled but Notion Integration Token is missing. Skipping Notion MCP start.');
                        continue;
                    }
                    svc.headers = {
                        ...(svc.headers || {}),
                        Authorization: `Bearer ${this.settings.notionIntegrationToken}`
                    };
                }
                try {
                    await this.mcpServiceManager.startService(svc);
                } catch (e) {
                    console.warn(`Failed to start MCP service ${svc.name}`, e);
                }
            }
        }

        this.registerView(
            VIEW_TYPE_CHAT,
            (leaf) => new ChatView(leaf, this)
        );

        this.addRibbonIcon('bot', 'Open AI Chat', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-ai-chat',
            name: 'Open AI Chat',
            callback: () => {
                this.activateView();
            }
        });

        this.addCommand({
            id: 'sync-external-data',
            name: 'Sync External Data (Notion/Airtable)',
            callback: async () => {
                await this.dataIngestionManager.syncExternalData();
            }
        });

        this.addCommand({
            id: 'rebuild-embeddings',
            name: 'Rebuild Embeddings',
            callback: async () => {
                await this.embeddingManager.rebuildEmbeddings();
            }
        });

        // Azure-specific commands
        if (this.settings.azureAIServicesEnabled) {
            this.addCommand({
                id: 'generate-document',
                name: 'Generate Document with Azure Agent',
                callback: async () => {
                    // แสดงหน้าต่างสำหรับสร้างเอกสาร
                    // ในอนาคตเราจะพัฒนา UI สำหรับการเลือกเทมเพลตและกรอกข้อมูล
                    // สำหรับตอนนี้ใช้การทดสอบง่ายๆ
                    if (this.settings.azureAgentEnabled && this.azureAgentService) {
                        try {
                            const testTemplate = {
                                id: 'test-template',
                                name: 'Test Template',
                                description: 'A test document template',
                                sections: [
                                    {
                                        id: 'section-1',
                                        title: 'Introduction',
                                        prompt: 'Write an introduction about artificial intelligence',
                                        order: 1
                                    },
                                    {
                                        id: 'section-2',
                                        title: 'Main Content',
                                        prompt: 'Explain the benefits of AI in document generation',
                                        order: 2
                                    },
                                    {
                                        id: 'section-3',
                                        title: 'Conclusion',
                                        prompt: 'Summarize the main points and provide a conclusion',
                                        order: 3
                                    }
                                ]
                            };

                            const document = await this.azureAgentService.generateDocument(testTemplate, {
                                topic: 'AI in Document Generation',
                                audience: 'Business professionals',
                                format: 'Formal'
                            });

                            // สร้างไฟล์ใหม่ในโฟลเดอร์ปัจจุบัน
                            const fileName = `Generated Document - ${new Date().toISOString().slice(0, 10)}.md`;
                            await this.app.vault.create(fileName, document);

                            // เปิดไฟล์ที่สร้าง
                            const file = this.app.vault.getAbstractFileByPath(fileName);
                            if (file && file instanceof TFile) {
                                await this.app.workspace.getLeaf().openFile(file);
                            }
                        } catch (error) {
                            console.error('Error generating document:', error);
                            // แสดงข้อความผิดพลาด
                            new Notice('Error generating document. Please check your Azure Agent settings.');
                        }
                    } else {
                        new Notice('Azure Agent is not enabled. Please enable it in the settings.');
                    }
                }
            });

            this.addCommand({
                id: 'index-current-note',
                name: 'Index Current Note to Azure AI Search',
                callback: async () => {
                    if (this.settings.azureAISearchApiKey && this.settings.azureAISearchEndpoint && this.azureAISearchService) {
                        try {
                            // รับไฟล์ปัจจุบัน
                            const activeFile = this.app.workspace.getActiveFile();
                            if (!activeFile) {
                                new Notice('No active file to index.');
                                return;
                            }

                            // อ่านเนื้อหาของไฟล์
                            const content = await this.app.vault.read(activeFile);

                            // สร้าง document สำหรับส่งไป Azure AI Search
                            const document = {
                                id: activeFile.path.replace(/\//g, '_'),
                                content: content,
                                title: activeFile.basename,
                                path: activeFile.path,
                                lastModified: activeFile.stat.mtime
                            };

                            // ส่งไปยัง Azure AI Search
                            await this.azureAISearchService.indexDocument(document);

                            new Notice(`${activeFile.basename} indexed successfully.`);
                        } catch (error) {
                            console.error('Error indexing document:', error);
                            new Notice('Error indexing document. Please check your Azure AI Search settings.');
                        }
                    } else {
                        new Notice('Azure AI Search is not configured. Please check your settings.');
                    }
                }
            });
        }

        this.addSettingTab(new AIPluginSettingTab(this.app, this));

        console.log('Obsidian AI Plugin loaded successfully');
    }

    async onunload() {
        console.log('Unloading Obsidian AI Plugin...');

        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CHAT);

        // Cleanup Azure services if initialized
        if (this.settings.azureAIServicesEnabled) {
            if (this.azureCosmosDBService) {
                // No cleanup needed for CosmosDB
            }

            if (this.azureAISearchService) {
                // No cleanup needed for Azure AI Search
            }

            if (this.azureAgentService) {
                // No cleanup needed for Azure Agent
            }
        }

        await this.advancedFeaturesManager.cleanup();
        await this.aiModelManager.cleanup();
        await this.chatService.cleanup();
        await this.ragService.cleanup();
        await this.dataIngestionManager.cleanup();
        await this.embeddingManager.cleanup();

        console.log('Obsidian AI Plugin unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    // แทนที่จะใช้ saveSettings ซึ่งซ้ำกับ Plugin class ให้ใช้ชื่อที่ต่างออกไป
    async updateSettings() {
        await this.saveData(this.settings);
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: VIEW_TYPE_CHAT, active: true });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }
}

