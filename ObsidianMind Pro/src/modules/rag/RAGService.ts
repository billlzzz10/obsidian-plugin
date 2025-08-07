import { Plugin } from 'obsidian';
import { EmbeddingManager } from '../embedding/EmbeddingManager';
import { VectorStore } from '../embedding/VectorStore';
import { RetrievedSource, RAGQuery } from '../utils/types';
import { DEFAULT_SIMILARITY_THRESHOLD, MAX_RETRIEVED_CHUNKS, DEFAULT_CONTEXT_WINDOW } from '../utils/constants';

export interface RAGResult {
    sources: RetrievedSource[];
    context: string;
    totalSources: number;
}

export class RAGService {
    private plugin: Plugin;
    private embeddingManager: EmbeddingManager;
    private vectorStore: VectorStore;
    private isInitialized = false;

    constructor(plugin: Plugin, embeddingManager: EmbeddingManager, vectorStore: VectorStore) {
        this.plugin = plugin;
        this.embeddingManager = embeddingManager;
        this.vectorStore = vectorStore;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        this.isInitialized = true;
        console.log('RAGService initialized');
    }

    async performRAG(query: string, options?: Partial<RAGQuery>): Promise<RAGResult> {
        if (!this.isInitialized) {
            throw new Error('RAGService not initialized');
        }

        // Prepare RAG query with defaults
        const ragQuery: RAGQuery = {
            query: query,
            maxResults: options?.maxResults || this.plugin.settings.maxRetrievedChunks || MAX_RETRIEVED_CHUNKS,
            similarityThreshold: options?.similarityThreshold || this.plugin.settings.similarityThreshold || DEFAULT_SIMILARITY_THRESHOLD,
            sourceTypes: options?.sourceTypes,
            filters: options?.filters
        };

        try {
            // Get embedding for the query
            const queryEmbedding = await this.embeddingManager.getEmbeddingsForQuery(query);

            // Search for similar vectors
            const retrievedSources = await this.vectorStore.searchSimilarWithVector(queryEmbedding, ragQuery);

            // Build context from retrieved sources
            const context = this.buildContext(retrievedSources, ragQuery);

            return {
                sources: retrievedSources,
                context: context,
                totalSources: retrievedSources.length
            };
        } catch (error) {
            console.error('Failed to perform RAG:', error);
            throw error;
        }
    }

    private buildContext(sources: RetrievedSource[], query: RAGQuery): string {
        if (sources.length === 0) {
            return '';
        }

        const contextWindow = this.plugin.settings.contextWindowSize || DEFAULT_CONTEXT_WINDOW;
        let context = '';
        let currentLength = 0;

        // Add sources to context until we reach the context window limit
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            const sourceText = this.formatSourceForContext(source, i + 1);

            // Check if adding this source would exceed the context window
            if (currentLength + sourceText.length > contextWindow) {
                // If this is the first source and it's too long, truncate it
                if (i === 0) {
                    const truncatedText = sourceText.substring(0, contextWindow - 100) + '...\n\n';
                    context += truncatedText;
                }
                break;
            }

            context += sourceText;
            currentLength += sourceText.length;
        }

        return context.trim();
    }

    private formatSourceForContext(source: RetrievedSource, index: number): string {
        const sourceInfo = `[Source ${index}: ${source.title}${source.path ? ` (${source.path})` : ''}]`;
        return `${sourceInfo}\n${source.content}\n\n`;
    }

    async getRelevantSources(
        query: string,
        maxResults: number = 5,
        sourceTypes?: ('obsidian' | 'notion' | 'airtable')[]
    ): Promise<RetrievedSource[]> {
        const ragQuery: RAGQuery = {
            query: query,
            maxResults: maxResults,
            similarityThreshold: this.plugin.settings.similarityThreshold || DEFAULT_SIMILARITY_THRESHOLD,
            sourceTypes: sourceTypes
        };

        const queryEmbedding = await this.embeddingManager.getEmbeddingsForQuery(query);
        return await this.vectorStore.searchSimilarWithVector(queryEmbedding, ragQuery);
    }

    async getContextForPrompt(query: string, maxContextLength?: number): Promise<string> {
        const ragResult = await this.performRAG(query);

        if (maxContextLength && ragResult.context.length > maxContextLength) {
            return ragResult.context.substring(0, maxContextLength - 3) + '...';
        }

        return ragResult.context;
    }

    async refreshVectorStore(): Promise<void> {
        console.log('Refreshing vector store...');
        await this.embeddingManager.rebuildEmbeddings();
        console.log('Vector store refreshed');
    }

    async getVectorStoreStats(): Promise<{
        totalVectors: number;
        obsidianVectors: number;
        notionVectors: number;
        airtableVectors: number;
    }> {
        const totalVectors = await this.vectorStore.getVectorCount();
        const obsidianVectors = (await this.vectorStore.getVectorsBySourceType('obsidian')).length;
        const notionVectors = (await this.vectorStore.getVectorsBySourceType('notion')).length;
        const airtableVectors = (await this.vectorStore.getVectorsBySourceType('airtable')).length;

        return {
            totalVectors,
            obsidianVectors,
            notionVectors,
            airtableVectors
        };
    }

    // Helper method to create a prompt with RAG context
    async createRAGPrompt(userQuery: string, systemPrompt?: string): Promise<string> {
        const ragResult = await this.performRAG(userQuery);

        let prompt = '';

        if (systemPrompt) {
            prompt += `${systemPrompt}\n\n`;
        }

        if (ragResult.context) {
            prompt += `Context from your knowledge base:\n${ragResult.context}\n\n`;
        }

        prompt += `User question: ${userQuery}`;

        if (ragResult.sources.length > 0) {
            prompt += `\n\nPlease answer based on the provided context. If the context doesn't contain enough information to answer the question, please say so.`;
        }

        return prompt;
    }

    async cleanup(): Promise<void> {
        // Cleanup any resources if needed
        this.isInitialized = false;
        console.log('RAGService cleaned up.');
    }
}

