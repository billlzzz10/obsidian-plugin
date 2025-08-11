export interface EmbedRequest {
  textChunks: string[];
  model?: string;
  chunkSize?: number;
  overlap?: number;
}

export interface VectorStore {
  upsert(vectors: number[][], meta?: Record<string, unknown>[]): Promise<void>;
  query(vector: number[], k: number): Promise<{ index: number; score: number }[]>;
}

export class InMemoryVectorStore implements VectorStore {
  private vectors: number[][] = [];
  async upsert(vectors: number[][]): Promise<void> {
    this.vectors.push(...vectors);
  }
  async query(vector: number[], k: number): Promise<{ index: number; score: number }[]> {
    const scores = this.vectors.map((v, i) => ({ index: i, score: this.cosineSim(v, vector) }));
    return scores.sort((a, b) => b.score - a.score).slice(0, k);
  }
  private cosineSim(a: number[], b: number[]): number {
    const dot = a.reduce((s, ai, i) => s + ai * (b[i] || 0), 0);
    const na = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
    const nb = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
    return na && nb ? dot / (na * nb) : 0;
  }
}

export interface EmbeddingSettingsShape {
  embeddingModel?: string;
  embeddingDimensions?: number;
}

import { BackendClient } from './BackendClient';

export class EmbeddingManager {
  constructor(
    private getSettings: () => EmbeddingSettingsShape & { backendUrl?: string },
    private store: VectorStore = new InMemoryVectorStore(),
    private backendClient?: BackendClient
  ) {}

  async rebuildEmbeddings(): Promise<void> {
    // Placeholder: In a real implementation, we'd scan vault docs and send to backend.
    // Keeping no-op to avoid side effects here.
    return Promise.resolve();
  }

  async embed({ textChunks }: EmbedRequest): Promise<number[][]> {
    const settings = this.getSettings();
    if (this.backendClient && settings.backendUrl) {
      // Minimal backend call sketch; assuming backend supports batch embeddings via embeddings/process
      // We map each chunk to a simple document object
      const documents = textChunks.map((t, i) => ({ id: `chunk-${i}`, text: t }));
      try {
        await this.backendClient.embeddingsProcess({ documents, model: settings.embeddingModel });
        // For now, still return local random vectors; fetching vectors back would require an endpoint
      } catch {
        // Fall back to local stub
      }
    }
    const dim = settings.embeddingDimensions || 384;
    return textChunks.map(() => Array.from({ length: dim }, () => Math.random()));
  }
}
