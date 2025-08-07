import { Plugin } from 'obsidian';
import { EmbeddingService } from './EmbeddingService';
import { VectorStore } from './VectorStore';
import { DataIngestionManager } from '../data-ingestion/DataIngestionManager';
import { EmbeddingVector, ObsidianNote, NotionPage, AirtableRecord } from '../utils/types';
import { chunkText, generateId } from '../utils/helpers';
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, MAX_CONTENT_LENGTH } from '../utils/constants';

export class EmbeddingManager {
    private plugin: Plugin;
    private embeddingService: EmbeddingService;
    public vectorStore: VectorStore;
    private dataIngestionManager?: DataIngestionManager; // To get data for embedding

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.embeddingService = new EmbeddingService(plugin);
        this.vectorStore = new VectorStore(plugin);
        // DataIngestionManager will be set after its initialization
    }

    async initialize() {
        await this.embeddingService.initialize();
        await this.vectorStore.initialize();
        // DataIngestionManager is initialized in main.ts and passed here later
        console.log('EmbeddingManager initialized.');
    }

    setDataIngestionManager(manager: DataIngestionManager) {
        this.dataIngestionManager = manager;
    }

    async rebuildEmbeddings(): Promise<void> {
        if (!this.dataIngestionManager) {
            console.error('DataIngestionManager is not set. Cannot rebuild embeddings.');
            return;
        }
        console.log('Rebuilding all embeddings...');
        await this.vectorStore.clearAllEmbeddings();

        // Process Obsidian notes
        const obsidianNotes = await this.dataIngestionManager.getObsidianNotes();
        await this.processDocuments(obsidianNotes, 'obsidian');

        // Process Notion pages
        const notionPages = await this.dataIngestionManager.getNotionPages();
        await this.processDocuments(notionPages, 'notion');

        // Process Airtable records
        const airtableRecords = await this.dataIngestionManager.getAirtableRecords();
        await this.processDocuments(airtableRecords, 'airtable');

        console.log('All embeddings rebuilt successfully.');
    }

    async processDocuments(documents: (ObsidianNote | NotionPage | AirtableRecord)[], sourceType: 'obsidian' | 'notion' | 'airtable'): Promise<void> {
        for (const doc of documents) {
            let contentToEmbed = '';
            let title = '';
            let sourceId = '';
            let path = '';
            let createdAt: Date;
            let updatedAt: Date;
            let tags: string[] = [];

            if (sourceType === 'obsidian') {
                const obsidianDoc = doc as ObsidianNote;
                contentToEmbed = obsidianDoc.content;
                title = obsidianDoc.name;
                sourceId = obsidianDoc.path;
                path = obsidianDoc.path;
                createdAt = obsidianDoc.createdAt;
                updatedAt = obsidianDoc.updatedAt;
                tags = obsidianDoc.tags;
            } else if (sourceType === 'notion') {
                const notionDoc = doc as NotionPage;
                contentToEmbed = notionDoc.content;
                title = notionDoc.title;
                sourceId = notionDoc.id;
                createdAt = notionDoc.createdAt;
                updatedAt = notionDoc.updatedAt;
            } else if (sourceType === 'airtable') {
                const airtableDoc = doc as AirtableRecord;
                // For Airtable, we might need to concatenate relevant fields
                contentToEmbed = JSON.stringify(airtableDoc.fields);
                title = airtableDoc.fields.Name || airtableDoc.id; // Assuming a 'Name' field or use ID
                sourceId = airtableDoc.id;
                createdAt = airtableDoc.createdAt;
                updatedAt = airtableDoc.updatedAt;
            }

            // Truncate content if too long
            if (contentToEmbed.length > MAX_CONTENT_LENGTH) {
                contentToEmbed = contentToEmbed.substring(0, MAX_CONTENT_LENGTH);
                console.warn(`Content for ${title} (${sourceId}) truncated due to length.`);
            }

            const chunks = chunkText(
                contentToEmbed,
                this.plugin.settings.chunkSize || DEFAULT_CHUNK_SIZE,
                this.plugin.settings.chunkOverlap || DEFAULT_CHUNK_OVERLAP
            );

            if (chunks.length === 0) {
                console.warn(`No chunks generated for ${title} (${sourceId}). Skipping embedding.`);
                continue;
            }

            try {
                const vectors = await this.embeddingService.getEmbeddings(chunks);
                const embeddings: EmbeddingVector[] = vectors.map((vector, i) => ({
                    id: generateId(),
                    vector: vector,
                    content: chunks[i],
                    metadata: {
                        sourceType: sourceType,
                        sourceId: sourceId,
                        title: title,
                        path: path,
                        tags: tags,
                        createdAt: createdAt,
                        updatedAt: updatedAt,
                        chunkIndex: i,
                        totalChunks: chunks.length
                    }
                }));

                if (embeddings.length > 0) {
                    await this.vectorStore.addEmbeddings(embeddings);
                    console.log(`Embeddings for ${title} (${sourceType}) added.`);
                }
            } catch (error) {
                console.error(`Failed to get embeddings for ${title} (${sourceId}):`, error);
            }
        }
    }

    async getEmbeddingsForQuery(query: string): Promise<number[]> {
        return this.embeddingService.getEmbedding(query);
    }

    async cleanup() {
        await this.vectorStore.cleanup();
        await this.embeddingService.cleanup();
        console.log('EmbeddingManager cleaned up.');
    }
}

