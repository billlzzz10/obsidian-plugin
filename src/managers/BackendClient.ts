import type { PluginSettings } from '../../main';

export interface BackendHealthResponse {
  status: string;
  timestamp: string;
  version?: string;
  services?: Record<string, unknown>;
}

export interface BackendChatResponse {
  response: string;
  conversation_id?: string;
  model?: string;
  sources?: Array<Record<string, unknown>>;
  timestamp?: string;
}

export interface BackendRagResponse {
  answer: string;
  sources: Array<Record<string, unknown>>;
  confidence?: number;
  model?: string;
  timestamp?: string;
}

export interface BackendEmbeddingsProcessResponse {
  processed_count: number;
  skipped_count: number;
  total_embeddings: number;
  processing_time?: number;
  timestamp?: string;
}

export class BackendClient {
  constructor(private getSettings: () => PluginSettings) {}

  private baseUrl(): string | null {
    const url = this.getSettings().backendUrl?.trim();
    if (!url) return null;
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  async health(): Promise<BackendHealthResponse> {
    const base = this.baseUrl();
    if (!base) throw new Error('Backend URL is not configured');
    const res = await fetch(`${base}/api/v1/health`);
    if (!res.ok) throw new Error(`Backend health failed: ${res.status}`);
    return res.json();
  }

  async chatMessage(params: {
    message: string;
    model?: string;
    conversation_id?: string | null;
    use_rag?: boolean;
    max_tokens?: number;
    temperature?: number;
    files?: Array<{ name: string; content: Blob; type?: string }>;
  }): Promise<BackendChatResponse> {
    const base = this.baseUrl();
    if (!base) throw new Error('Backend URL is not configured');
    const form = new FormData();
    form.append('message', params.message);
    if (params.model) form.append('model', params.model);
    if (params.conversation_id) form.append('conversation_id', params.conversation_id);
    form.append('use_rag', String(params.use_rag ?? true));
    form.append('max_tokens', String(params.max_tokens ?? 1000));
    form.append('temperature', String(params.temperature ?? 0.7));
    if (params.files) {
      for (const f of params.files) {
        form.append('files', f.content, f.name);
      }
    }
    const res = await fetch(`${base}/api/v1/chat/message`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Backend chat failed: ${res.status}`);
    return res.json();
  }

  async ragQuery(params: {
    query: string;
    model?: string;
    max_sources?: number;
    min_confidence?: number;
    max_tokens?: number;
    temperature?: number;
  }): Promise<BackendRagResponse> {
    const base = this.baseUrl();
    if (!base) throw new Error('Backend URL is not configured');
    const q = new URLSearchParams();
    q.set('query', params.query);
    if (params.model) q.set('model', params.model);
    if (params.max_sources != null) q.set('max_sources', String(params.max_sources));
    if (params.min_confidence != null) q.set('min_confidence', String(params.min_confidence));
    if (params.max_tokens != null) q.set('max_tokens', String(params.max_tokens));
    if (params.temperature != null) q.set('temperature', String(params.temperature));
    const res = await fetch(`${base}/api/v1/rag/query`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: q.toString() });
    if (!res.ok) throw new Error(`Backend RAG failed: ${res.status}`);
    return res.json();
  }

  async embeddingsProcess(params: {
    documents: Array<Record<string, unknown>>;
    model?: string;
    batch_size?: number;
    force_reprocess?: boolean;
  }): Promise<BackendEmbeddingsProcessResponse> {
    const base = this.baseUrl();
    if (!base) throw new Error('Backend URL is not configured');
    const body = JSON.stringify({
      documents: params.documents,
      model: params.model ?? 'all-MiniLM-L6-v2',
      batch_size: params.batch_size ?? 32,
      force_reprocess: params.force_reprocess ?? false,
    });
    const res = await fetch(`${base}/api/v1/embeddings/process`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (!res.ok) throw new Error(`Backend embeddings failed: ${res.status}`);
    return res.json();
  }
}
