export type Provider = 'openai' | 'anthropic' | 'google' | 'azure';

export interface ModelRequestOptions {
  provider: Provider;
  model: string;
  apiKey?: string;
  endpoint?: string;
  deployment?: string;
  region?: string;
  apiVersion?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// Minimal settings shape used by this manager
export interface SettingsShape {
  aiProvider?: Provider;
  selectedModel?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  azureApiKey?: string;
  azureEndpoint?: string;
  azureOpenAIDeploymentName?: string;
  azureDeploymentName?: string;
  azureApiVersion?: string;
  streamResponses?: boolean;
}

import { BackendClient } from './BackendClient';

export class AIModelManager {
  constructor(private getSettings: () => SettingsShape & { backendUrl?: string; ragEnabled?: boolean; selectedModel?: string }, private backendClient?: BackendClient) {}

  async chat(messages: ChatMessage[], opts?: Partial<ModelRequestOptions>): Promise<ChatResult> {
    const settings = this.getSettings();
    // Prefer backend if configured
    if (this.backendClient && settings.backendUrl) {
      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      const model = opts?.model || settings.selectedModel;
      const resp = await this.backendClient.chatMessage({
        message: lastUser ? lastUser.content : messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        model,
        use_rag: settings.ragEnabled ?? true,
        max_tokens: opts?.maxTokens,
        temperature: opts?.temperature,
      });
      return { text: resp.response };
    }

    const provider: Provider = opts?.provider || settings.aiProvider || 'openai';

    switch (provider) {
      case 'openai':
        return this.chatOpenAI(messages, settings, opts);
      case 'anthropic':
        return this.chatAnthropic(messages, settings, opts);
      case 'google':
        return this.chatGoogle(messages, settings, opts);
      case 'azure':
        return this.chatAzure(messages, settings, opts);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // NOTE: Implementation here is minimal and backend-agnostic; adapt to your backend if needed.
  private async chatOpenAI(messages: ChatMessage[], settings: SettingsShape, opts?: Partial<ModelRequestOptions>): Promise<ChatResult> {
    const apiKey = settings.openaiApiKey;
    const model = opts?.model || settings.selectedModel || 'gpt-3.5-turbo';
    if (!apiKey) throw new Error('OpenAI API key is missing');

    const body = {
      model,
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 512,
      stream: settings.streamResponses || false,
    };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
  });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${res.statusText}`);
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? '';
    const usage = json?.usage;
    return { text, usage };
  }

  private async chatAnthropic(messages: ChatMessage[], settings: SettingsShape, opts?: Partial<ModelRequestOptions>): Promise<ChatResult> {
    const apiKey = settings.anthropicApiKey;
    const model = opts?.model || settings.selectedModel || 'claude-3-opus';
    if (!apiKey) throw new Error('Anthropic API key is missing');

    const system = messages.find(m => m.role === 'system')?.content;
    const userParts = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: opts?.maxTokens ?? 512,
        temperature: opts?.temperature ?? 0.7,
        system,
        messages: userParts,
      }),
    });

    if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${res.statusText}`);
    const json = await res.json();
    const text = json?.content?.[0]?.text ?? '';
    return { text };
  }

  private async chatGoogle(messages: ChatMessage[], settings: SettingsShape, opts?: Partial<ModelRequestOptions>): Promise<ChatResult> {
    const apiKey = settings.googleApiKey;
    const model = opts?.model || settings.selectedModel || 'gemini-pro';
    if (!apiKey) throw new Error('Google API key is missing');

    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

    if (!res.ok) throw new Error(`Google error: ${res.status} ${res.statusText}`);
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { text };
  }

  private async chatAzure(messages: ChatMessage[], settings: SettingsShape, opts?: Partial<ModelRequestOptions>): Promise<ChatResult> {
    const apiKey = settings.azureApiKey;
    const endpoint = settings.azureEndpoint;
    const deployment = settings.azureOpenAIDeploymentName || settings.azureDeploymentName;
    const apiVersion = settings.azureApiVersion || '2023-05-15';
    if (!apiKey || !endpoint || !deployment) throw new Error('Azure OpenAI credentials are missing');

    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens ?? 512,
        stream: settings.streamResponses || false,
      }),
    });

    if (!res.ok) throw new Error(`Azure OpenAI error: ${res.status} ${res.statusText}`);
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? '';
    const usage = json?.usage;
    return { text, usage };
  }
}
