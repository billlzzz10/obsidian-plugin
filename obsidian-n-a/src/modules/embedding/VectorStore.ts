import { Plugin } from 'obsidian';
import { EmbeddingVector, RetrievedSource, RAGQuery } from '../utils/types';
import { cosineSimilarity, generateId } from '../utils/helpers';
import { VECTOR_STORE_NAME, DEFAULT_SIMILARITY_THRESHOLD } from '../utils/constants';

interface VectorStoreData {
    vectors: EmbeddingVector[];
    version: string;
    lastUpdated: Date;
}

export class VectorStore {
    private plugin: Plugin;
    private vectors: EmbeddingVector[] = [];
    private isInitialized = false;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await this.loadVectors();
            this.isInitialized = true;
            console.log(`VectorStore initialized with ${this.vectors.length} vectors`);
        } catch (error) {
            console.error('Failed to initialize VectorStore:', error);
            this.vectors = [];
            this.isInitialized = true;
        }
    }

    async addEmbedding(embedding: EmbeddingVector): Promise<void> {
        this.vectors.push(embedding);
        await this.saveVectors();
    }

    async addEmbeddings(embeddings: EmbeddingVector[]): Promise<void> {
        this.vectors.push(...embeddings);
        await this.saveVectors();
    }

    async removeEmbeddingsBySourceId(sourceId: string): Promise<void> {
        const initialLength = this.vectors.length;
        this.vectors = this.vectors.filter(v => v.metadata.sourceId !== sourceId);
        
        if (this.vectors.length !== initialLength) {
            await this.saveVectors();
            console.log(`Removed ${initialLength - this.vectors.length} embeddings for source: ${sourceId}`);
        }
    }

    async clearAllEmbeddings(): Promise<void> {
        this.vectors = [];
        await this.saveVectors();
        console.log('All embeddings cleared');
    }

    async searchSimilar(query: RAGQuery): Promise<RetrievedSource[]> {
        if (!this.isInitialized) {
            throw new Error('VectorStore not initialized');
        }

        // Get query embedding (this should be done by the caller)
        // For now, we'll assume the query contains the embedding vector
        // In practice, this would be handled by the RAGService
        
        const results: Array<{ source: RetrievedSource; similarity: number }> = [];

        for (const vector of this.vectors) {
            // Skip if source type filter is specified and doesn't match
            if (query.sourceTypes && !query.sourceTypes.includes(vector.metadata.sourceType)) {
                continue;
            }

            // Apply additional filters if specified
            if (query.filters) {
                let shouldSkip = false;
                for (const [key, value] of Object.entries(query.filters)) {
                    if (vector.metadata[key as keyof typeof vector.metadata] !== value) {
                        shouldSkip = true;
                        break;
                    }
                }
                if (shouldSkip) continue;
            }

            // Calculate similarity (placeholder - actual similarity calculation done in RAGService)
            // This is just for structure - the actual implementation would receive query vector
            const similarity = 0.8; // Placeholder

            if (similarity >= (query.similarityThreshold || DEFAULT_SIMILARITY_THRESHOLD)) {
                results.push({
                    source: {
                        id: vector.id,
                        title: vector.metadata.title,
                        content: vector.content,
                        similarity: similarity,
                        sourceType: vector.metadata.sourceType,
                        sourceId: vector.metadata.sourceId,
                        path: vector.metadata.path
                    },
                    similarity: similarity
                });
            }
        }

        // Sort by similarity (descending) and limit results
        results.sort((a, b) => b.similarity - a.similarity);
        const limitedResults = results.slice(0, query.maxResults);

        return limitedResults.map(r => r.source);
    }

    async searchSimilarWithVector(queryVector: number[], query: RAGQuery): Promise<RetrievedSource[]> {
        if (!this.isInitialized) {
            throw new Error('VectorStore not initialized');
        }

        const results: Array<{ source: RetrievedSource; similarity: number }> = [];

        for (const vector of this.vectors) {
            // Skip if source type filter is specified and doesn't match
            if (query.sourceTypes && !query.sourceTypes.includes(vector.metadata.sourceType)) {
                continue;
            }

            // Apply additional filters if specified
            if (query.filters) {
                let shouldSkip = false;
                for (const [key, value] of Object.entries(query.filters)) {
                    if (vector.metadata[key as keyof typeof vector.metadata] !== value) {
                        shouldSkip = true;
                        break;
                    }
                }
                if (shouldSkip) continue;
            }

            // Calculate cosine similarity
            const similarity = cosineSimilarity(queryVector, vector.vector);

            if (similarity >= (query.similarityThreshold || DEFAULT_SIMILARITY_THRESHOLD)) {
                results.push({
                    source: {
                        id: vector.id,
                        title: vector.metadata.title,
                        content: vector.content,
                        similarity: similarity,
                        sourceType: vector.metadata.sourceType,
                        sourceId: vector.metadata.sourceId,
                        path: vector.metadata.path
                    },
                    similarity: similarity
                });
            }
        }

        // Sort by similarity (descending) and limit results
        results.sort((a, b) => b.similarity - a.similarity);
        const limitedResults = results.slice(0, query.maxResults);

        return limitedResults.map(r => r.source);
    }

    async getVectorCount(): Promise<number> {
        return this.vectors.length;
    }

    async getVectorsBySourceType(sourceType: 'obsidian' | 'notion' | 'airtable'): Promise<EmbeddingVector[]> {
        return this.vectors.filter(v => v.metadata.sourceType === sourceType);
    }

    private async loadVectors(): Promise<void> {
        try {
            const data = await this.plugin.loadData();
            const vectorData = data?.[VECTOR_STORE_NAME] as VectorStoreData;
            
            if (vectorData && vectorData.vectors) {
                this.vectors = vectorData.vectors;
                console.log(`Loaded ${this.vectors.length} vectors from storage`);
            } else {
                this.vectors = [];
                console.log('No existing vectors found, starting with empty store');
            }
        } catch (error) {
            console.error('Failed to load vectors:', error);
            this.vectors = [];
        }
    }

    private async saveVectors(): Promise<void> {
        try {
            const data = await this.plugin.loadData() || {};
            
            const vectorData: VectorStoreData = {
                vectors: this.vectors,
                version: '1.0.0',
                lastUpdated: new Date()
            };
            
            data[VECTOR_STORE_NAME] = vectorData;
            await this.plugin.saveData(data);
            
            console.log(`Saved ${this.vectors.length} vectors to storage`);
        } catch (error) {
            console.error('Failed to save vectors:', error);
            throw error;
        }
    }

    async cleanup(): Promise<void> {
        // Save any pending changes
        if (this.vectors.length > 0) {
            await this.saveVectors();
        }
        console.log('VectorStore cleaned up');
    }
}

