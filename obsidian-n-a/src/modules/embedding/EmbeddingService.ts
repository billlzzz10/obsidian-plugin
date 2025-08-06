import { Plugin } from 'obsidian';
import { pipeline, Pipeline } from '@xenova/transformers';
import { DEFAULT_EMBEDDING_MODEL, EMBEDDING_MODELS } from '../utils/constants';

export class EmbeddingService {
    private plugin: Plugin;
    private embeddingPipeline: Pipeline | null = null;
    private isInitialized = false;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const modelName = this.plugin.settings.embeddingModel || DEFAULT_EMBEDDING_MODEL;
            console.log(`Initializing embedding model: ${modelName}`);

            // Load the embedding model using Transformers.js
            this.embeddingPipeline = await pipeline("feature-extraction", modelName, {
                quantized: true, // Use quantized model for better performance
                progress_callback: (progress: any) => {
                    if (progress.status === "downloading") {
                        console.log(`Downloading embedding model: ${progress.progress}%`);
                    }
                }
            }) as Pipeline; // Type assertion to resolve the error

            this.isInitialized = true;
            console.log('EmbeddingService initialized successfully');
        } catch (error) {
            console.error('Failed to initialize EmbeddingService:', error);
            throw error;
        }
    }

    async getEmbedding(text: string): Promise<number[]> {
        if (!this.isInitialized || !this.embeddingPipeline) {
            throw new Error('EmbeddingService not initialized');
        }

        try {
            // Clean and prepare text
            const cleanText = this.preprocessText(text);
            
            // Get embedding from the model
            const output = await this.embeddingPipeline(cleanText, {
                pooling: 'mean',
                normalize: true
            });

            // Convert to regular array
            const embedding = Array.from(output.data) as number[];
            
            return embedding;
        } catch (error) {
            console.error('Failed to get embedding:', error);
            throw error;
        }
    }

    async getEmbeddings(texts: string[]): Promise<number[][]> {
        if (!this.isInitialized || !this.embeddingPipeline) {
            throw new Error("EmbeddingService not initialized");
        }

        try {
            const cleanTexts = texts.map(text => this.preprocessText(text));
            const outputs = await this.embeddingPipeline(cleanTexts, {
                pooling: "mean",
                normalize: true
            });

            // outputs will be an array of outputs if cleanTexts was an array
            if (Array.isArray(outputs)) {
                return outputs.map(output => Array.from(output.data) as number[]);
            } else {
                // If only one text was passed, it might return a single output
                return [Array.from(outputs.data) as number[]];
            }
        } catch (error) {
            console.error("Failed to get embeddings in batch:", error);
            throw error;
        }
    }

    private preprocessText(text: string): string {
        // Remove excessive whitespace and normalize
        return text
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 512); // Limit to model's max sequence length
    }

    getModelInfo(): { name: string; dimensions: number; maxSequenceLength: number } {
        const modelName = this.plugin.settings.embeddingModel || DEFAULT_EMBEDDING_MODEL;
        const modelConfig = EMBEDDING_MODELS[modelName as keyof typeof EMBEDDING_MODELS];
        
        return {
            name: modelName,
            dimensions: modelConfig?.dimensions || 384,
            maxSequenceLength: modelConfig?.maxSequenceLength || 256
        };
    }

    async cleanup(): Promise<void> {
        this.embeddingPipeline = null;
        this.isInitialized = false;
        console.log('EmbeddingService cleaned up');
    }
}

