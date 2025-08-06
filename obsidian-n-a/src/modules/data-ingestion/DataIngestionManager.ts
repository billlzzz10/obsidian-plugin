import { Plugin, TFile } from 'obsidian';
import { NotionAPI } from './NotionAPI';
import { AirtableAPI } from './AirtableAPI';
import { EmbeddingManager } from '../embedding/EmbeddingManager';
import { ObsidianNote, NotionPage, AirtableRecord, SyncStatus } from '../utils/types';
import { extractFrontmatter } from '../utils/helpers';
import { MIN_SYNC_INTERVAL, MAX_SYNC_INTERVAL } from '../utils/constants';

export class DataIngestionManager {
    private plugin: Plugin;
    private notionAPI: NotionAPI;
    private airtableAPI: AirtableAPI;
    private embeddingManager: EmbeddingManager; // To trigger embedding rebuild
    private syncIntervalId: number | null = null;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.notionAPI = new NotionAPI(plugin);
        this.airtableAPI = new AirtableAPI(plugin);
        // EmbeddingManager will be set after its initialization
    }

    async initialize() {
        // Set embedding manager reference
        this.embeddingManager = this.plugin.embeddingManager;

        // Start auto-sync if enabled
        this.startAutoSync();

        console.log('DataIngestionManager initialized.');
    }

    async syncExternalData(): Promise<void> {
        console.log('Starting external data sync...');
        
        // Sync Notion data
        if (this.plugin.settings.notionIntegrationToken && this.plugin.settings.notionDatabaseIds.length > 0) {
            await this.syncNotionData();
        }

        // Sync Airtable data
        if (this.plugin.settings.airtableApiKey && this.plugin.settings.airtableBaseIds.length > 0) {
            await this.syncAirtableData();
        }

        // After syncing, rebuild embeddings for new/updated data
        await this.embeddingManager.rebuildEmbeddings();

        console.log('External data sync complete.');
    }

    private async syncNotionData(): Promise<void> {
        console.log('Syncing Notion data...');
        const status: SyncStatus = {
            sourceType: 'notion',
            lastSync: new Date(),
            status: 'syncing',
            itemsProcessed: 0,
            totalItems: 0
        };
        // TODO: Implement actual Notion data fetching and processing
        // For now, simulate fetching
        const notionPages: NotionPage[] = await this.notionAPI.fetchPages();
        status.totalItems = notionPages.length;
        status.itemsProcessed = notionPages.length;
        status.status = 'idle';
        console.log(`Notion sync complete. Processed ${notionPages.length} pages.`);
        // You might want to store this status in plugin state or settings
    }

    private async syncAirtableData(): Promise<void> {
        console.log('Syncing Airtable data...');
        const status: SyncStatus = {
            sourceType: 'airtable',
            lastSync: new Date(),
            status: 'syncing',
            itemsProcessed: 0,
            totalItems: 0
        };
        // TODO: Implement actual Airtable data fetching and processing
        // For now, simulate fetching
        const airtableRecords: AirtableRecord[] = await this.airtableAPI.fetchRecords();
        status.totalItems = airtableRecords.length;
        status.itemsProcessed = airtableRecords.length;
        status.status = 'idle';
        console.log(`Airtable sync complete. Processed ${airtableRecords.length} records.`);
        // You might want to store this status in plugin state or settings
    }

    async getObsidianNotes(): Promise<ObsidianNote[]> {
        const notes: ObsidianNote[] = [];
        const markdownFiles = this.plugin.app.vault.getMarkdownFiles();

        for (const file of markdownFiles) {
            const content = await this.plugin.app.vault.read(file);
            const { frontmatter, content: cleanedContent } = extractFrontmatter(content);
            
            notes.push({
                path: file.path,
                name: file.basename,
                content: cleanedContent,
                frontmatter: frontmatter,
                tags: this.getTagsFromFile(file, frontmatter),
                createdAt: new Date(file.stat.ctime),
                updatedAt: new Date(file.stat.mtime),
            });
        }
        return notes;
    }

    async getNotionPages(): Promise<NotionPage[]> {
        return this.notionAPI.fetchPages();
    }

    async getAirtableRecords(): Promise<AirtableRecord[]> {
        return this.airtableAPI.fetchRecords();
    }

    private getTagsFromFile(file: TFile, frontmatter: Record<string, any>): string[] {
        const tags: string[] = [];
        // Tags from frontmatter
        if (frontmatter.tags) {
            if (Array.isArray(frontmatter.tags)) {
                tags.push(...frontmatter.tags.map((tag: string) => tag.replace(/^#/, '')));
            } else if (typeof frontmatter.tags === 'string') {
                tags.push(...frontmatter.tags.split(',').map((tag: string) => tag.trim().replace(/^#/, '')));
            }
        }
        // Inline tags (basic regex, might need more robust parsing)
        const inlineTags = file.content?.match(/#\w+/g) || [];
        tags.push(...inlineTags.map((tag: string) => tag.replace(/^#/, '')));
        return Array.from(new Set(tags)); // Remove duplicates
    }

    startAutoSync() {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
        }

        if (this.plugin.settings.autoSync) {
            let intervalMinutes = this.plugin.settings.syncInterval;
            if (intervalMinutes < MIN_SYNC_INTERVAL) intervalMinutes = MIN_SYNC_INTERVAL;
            if (intervalMinutes > MAX_SYNC_INTERVAL) intervalMinutes = MAX_SYNC_INTERVAL;

            this.syncIntervalId = window.setInterval(async () => {
                console.log('Auto-sync triggered...');
                await this.syncExternalData();
            }, intervalMinutes * 60 * 1000);
            console.log(`Auto-sync started, interval: ${intervalMinutes} minutes`);
        }
    }

    stopAutoSync() {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
            console.log('Auto-sync stopped.');
        }
    }

    async cleanup() {
        this.stopAutoSync();
        console.log('DataIngestionManager cleaned up.');
    }
}


