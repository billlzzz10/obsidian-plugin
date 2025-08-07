import { Plugin } from 'obsidian';
import { NotionPage } from '../utils/types';
import { NOTION_API_BASE, DEFAULT_REQUEST_TIMEOUT } from '../utils/constants';
import { retryWithBackoff, createTimeoutSignal } from '../utils/helpers';

export class NotionAPI {
    private plugin!: Plugin;
    private apiKey: string;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.apiKey = plugin.settings.notionIntegrationToken;
    }

    async fetchPages(): Promise<NotionPage[]> {
        if (!this.apiKey) {
            throw new Error('Notion integration token not configured');
        }

        const pages: NotionPage[] = [];

        for (const databaseId of this.plugin.settings.notionDatabaseIds) {
            try {
                const databasePages = await this.fetchPagesFromDatabase(databaseId);
                pages.push(...databasePages);
            } catch (error) {
                console.error(`Failed to fetch pages from database ${databaseId}:`, error);
            }
        }

        return pages;
    }

    private async fetchPagesFromDatabase(databaseId: string): Promise<NotionPage[]> {
        const pages: NotionPage[] = [];
        let hasMore = true;
        let nextCursor: string | undefined;

        while (hasMore) {
            const response = await retryWithBackoff(async () => {
                const url = `${NOTION_API_BASE}/databases/${databaseId}/query`;
                const body: any = {
                    page_size: 100
                };

                if (nextCursor) {
                    body.start_cursor = nextCursor;
                }

                const fetchResponse = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Notion-Version': '2022-06-28'
                    },
                    body: JSON.stringify(body),
                    signal: createTimeoutSignal(DEFAULT_REQUEST_TIMEOUT)
                });

                if (!fetchResponse.ok) {
                    throw new Error(`Notion API error: ${fetchResponse.status} ${fetchResponse.statusText}`);
                }

                return fetchResponse.json();
            });

            for (const result of response.results) {
                try {
                    const page = await this.convertNotionPageToNotionPage(result);
                    pages.push(page);
                } catch (error) {
                    console.error(`Failed to convert Notion page ${result.id}:`, error);
                }
            }

            hasMore = response.has_more;
            nextCursor = response.next_cursor;
        }

        return pages;
    }

    private async convertNotionPageToNotionPage(notionResult: any): Promise<NotionPage> {
        let title = 'Untitled';
        const properties = notionResult.properties;
        for (const propertyName in properties) {
            const property = properties[propertyName];
            if (property.type === 'title' && property.title.length > 0) {
                title = property.title[0].plain_text;
                break;
            }
        }

        // Fetch page content
        const content = await this.fetchPageContent(notionResult.id);

        return {
            id: notionResult.id,
            title: title,
            content: content,
            properties: notionResult.properties,
            createdAt: new Date(notionResult.created_time),
            updatedAt: new Date(notionResult.last_edited_time),
            url: notionResult.url
        };
    }

    private async fetchPageContent(pageId: string): Promise<string> {
        try {
            const response = await retryWithBackoff(async () => {
                const url = `${NOTION_API_BASE}/blocks/${pageId}/children`;
                const fetchResponse = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Notion-Version': '2022-06-28'
                    },
                    signal: createTimeoutSignal(DEFAULT_REQUEST_TIMEOUT)
                });

                if (!fetchResponse.ok) {
                    throw new Error(`Notion API error: ${fetchResponse.status} ${fetchResponse.statusText}`);
                }

                return fetchResponse.json();
            });

            return this.convertBlocksToText(response.results);
        } catch (error) {
            console.error(`Failed to fetch content for page ${pageId}:`, error);
            return '';
        }
    }

    private convertBlocksToText(blocks: any[]): string {
        let text = '';

        for (const block of blocks) {
            switch (block.type) {
                case 'paragraph':
                    text += this.extractTextFromRichText(block.paragraph.rich_text) + '\n\n';
                    break;
                case 'heading_1':
                    text += '# ' + this.extractTextFromRichText(block.heading_1.rich_text) + '\n\n';
                    break;
                case 'heading_2':
                    text += '## ' + this.extractTextFromRichText(block.heading_2.rich_text) + '\n\n';
                    break;
                case 'heading_3':
                    text += '### ' + this.extractTextFromRichText(block.heading_3.rich_text) + '\n\n';
                    break;
                case 'bulleted_list_item':
                    text += '- ' + this.extractTextFromRichText(block.bulleted_list_item.rich_text) + '\n';
                    break;
                case 'numbered_list_item':
                    text += '1. ' + this.extractTextFromRichText(block.numbered_list_item.rich_text) + '\n';
                    break;
                case 'to_do': {
                    const checked = block.to_do.checked ? '[x]' : '[ ]';
                    text += `${checked} ${this.extractTextFromRichText(block.to_do.rich_text)}\n`;
                    break;
                }
                case 'code':
                    text += '```\n' + this.extractTextFromRichText(block.code.rich_text) + '\n```\n\n';
                    break;
                case 'quote':
                    text += '> ' + this.extractTextFromRichText(block.quote.rich_text) + '\n\n';
                    break;
                default:
                    // For other block types, try to extract text if available
                    if (block[block.type] && block[block.type].rich_text) {
                        text += this.extractTextFromRichText(block[block.type].rich_text) + '\n\n';
                    }
            }
        }

        return text.trim();
    }

    private extractTextFromRichText(richText: any[]): string {
        return richText.map(text => text.plain_text).join('');
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${NOTION_API_BASE}/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Notion-Version': '2022-06-28'
                },
                signal: createTimeoutSignal(DEFAULT_REQUEST_TIMEOUT)
            });

            return response.ok;
        } catch (error) {
            console.error('Notion connection test failed:', error);
            return false;
        }
    }
}

