import "./global.d.ts";
import { Plugin, WorkspaceLeaf } from 'obsidian';
import { AIPluginSettings, DEFAULT_SETTINGS } from './settings';
import { AIPluginSettingTab } from './ui/SettingsTab';
import { ChatView, VIEW_TYPE_CHAT } from './ui/ChatView';
import { DataIngestionManager } from './modules/data-ingestion/DataIngestionManager';
import { EmbeddingManager } from './modules/embedding/EmbeddingManager';
import { RAGService } from './modules/rag/RAGService';
import { AIModelManager } from './modules/ai-models/AIModelManager';
import { ChatService } from './modules/chat/ChatService';
import { AdvancedFeaturesManager } from './modules/advanced-features/AdvancedFeaturesManager';

export default class AIPlugin extends Plugin {
    settings: AIPluginSettings;
    dataIngestionManager: DataIngestionManager;
    embeddingManager: EmbeddingManager;
    ragService: RAGService;
    aiModelManager: AIModelManager;
    chatService: ChatService;
    advancedFeaturesManager: AdvancedFeaturesManager;

    async onload() {
        console.log('Loading Obsidian AI Plugin...');
        
        await this.loadSettings();

        // Initialize managers and services
        this.dataIngestionManager = new DataIngestionManager(this);
        this.embeddingManager = new EmbeddingManager(this);
        this.ragService = new RAGService(this, this.embeddingManager, this.embeddingManager.vectorStore);
        this.aiModelManager = new AIModelManager(this);
        this.chatService = new ChatService(this);
        this.advancedFeaturesManager = new AdvancedFeaturesManager(this);

        await this.dataIngestionManager.initialize();
        await this.embeddingManager.initialize();
        this.embeddingManager.setDataIngestionManager(this.dataIngestionManager); // Pass DataIngestionManager reference
        await this.ragService.initialize();
        await this.aiModelManager.initialize();
        await this.chatService.initialize();
        await this.advancedFeaturesManager.initialize();

        this.registerView(
            VIEW_TYPE_CHAT,
            (leaf) => new ChatView(leaf, this)
        );

        this.addRibbonIcon("bot", "Open AI Chat", () => {
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

        this.addSettingTab(new AIPluginSettingTab(this.app, this));

        console.log('Obsidian AI Plugin loaded successfully');
    }

    async onunload() {
        console.log('Unloading Obsidian AI Plugin...');
        
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CHAT);

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

    async saveSettings() {
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

