import { Plugin } from 'obsidian';
import { DEFAULT_REQUEST_TIMEOUT, NOTION_API_BASE } from '../utils/constants';
import { createTimeoutSignal } from '../utils/helpers';

export interface CredentialRecord {
    brand: string;
    token: string;
    baseUrl?: string | null;
    pageId?: string;
    updatedAt?: Date;
}

// Resolve provider/brand credentials at runtime from a Notion database
export class CredentialsResolver {
    private plugin: Plugin;
    private cache: Map<string, CredentialRecord> = new Map(); // key = lowercase brand
    private lastLoadedAt?: number;
    private ttlMs: number = 5 * 60 * 1000; // 5 minutes cache TTL

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async warmup(force = false): Promise<void> {
        const enabled = (this.plugin.settings as any).runtimeCredentialsEnabled;
        const dbId = (this.plugin.settings as any).secretsNotionDatabaseId as string;
        const token = (this.plugin.settings as any).notionIntegrationToken as string;
        if (!enabled) return;
        if (!dbId || !token) return;

        const now = Date.now();
        if (!force && this.lastLoadedAt && now - this.lastLoadedAt < this.ttlMs && this.cache.size > 0) {
            return;
        }
        await this.loadFromNotion(dbId, token);
        this.lastLoadedAt = Date.now();
    }

    // Public helper: get token by provider name (maps to Brand where possible)
    async getTokenForProvider(provider: string): Promise<string | undefined> {
        const entry = await this.getByProvider(provider);
        return entry?.token;
    }

    // Public helper: get a record by brand
    async getByBrand(brand: string): Promise<CredentialRecord | undefined> {
        await this.warmup();
        const key = (brand || '').toLowerCase();
        return this.cache.get(key);
    }

    // Map provider ids to Brand strings used in Notion DB, with a couple of common typos/synonyms
    private mapProviderToBrand(provider: string): string[] {
        const p = (provider || '').toLowerCase();
        switch (p) {
            case 'openai':
                return ['openai'];
            case 'anthropic':
                return ['anthropic', 'antropic'];
            case 'google':
                return ['google', 'google ai', 'gemini'];
            case 'azure':
                return ['azure', 'microsoft'];
            default:
                return [p];
        }
    }

    private async getByProvider(provider: string): Promise<CredentialRecord | undefined> {
        await this.warmup();
        const candidates = this.mapProviderToBrand(provider);
        for (const c of candidates) {
            const hit = this.cache.get(c);
            if (hit?.token) return hit;
        }
        return undefined;
    }

    private async loadFromNotion(databaseId: string, notionToken: string): Promise<void> {
        try {
            const all: CredentialRecord[] = [];
            let nextCursor: string | undefined = undefined;
            let hasMore = true;

            while (hasMore) {
                const res: Response = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${notionToken}`,
                        'Content-Type': 'application/json',
                        'Notion-Version': '2022-06-28'
                    },
                    body: JSON.stringify({ page_size: 100, start_cursor: nextCursor }),
                    signal: createTimeoutSignal(DEFAULT_REQUEST_TIMEOUT)
                });

                if (!res.ok) {
                    console.error('CredentialsResolver Notion query failed:', res.status, res.statusText);
                    break;
                }

                const data: any = await res.json();
                for (const page of (data.results || [])) {
                    try {
                        const rec = this.pageToCredential(page);
                        if (rec && rec.token) all.push(rec);
                    } catch (e) {
                        // Swallow this item, continue
                    }
                }
                hasMore = !!data.has_more;
                nextCursor = data.next_cursor || undefined;
            }

            // Rebuild cache
            const newMap = new Map<string, CredentialRecord>();
            for (const r of all) {
                if (!r.brand) continue;
                newMap.set(r.brand.toLowerCase(), r);
            }
            this.cache = newMap;
        } catch (error) {
            console.error('CredentialsResolver loadFromNotion error:', error);
        }
    }

    private pageToCredential(page: any): CredentialRecord | null {
        const props = page?.properties || {};
        const brand = props['Brand']?.select?.name || props['API Name']?.title?.[0]?.plain_text || '';
        const token = props['API Key/Token']?.rich_text?.[0]?.plain_text || '';
        const baseUrl = props['Base URL']?.url ?? null;
        if (!brand || !token) return null;
        return {
            brand,
            token,
            baseUrl,
            pageId: page.id,
            updatedAt: page.last_edited_time ? new Date(page.last_edited_time) : undefined
        };
    }
}
