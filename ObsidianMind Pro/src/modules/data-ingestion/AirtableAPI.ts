import { Plugin } from 'obsidian';
import { AirtableRecord } from '../utils/types';
import { AIRTABLE_API_BASE, DEFAULT_REQUEST_TIMEOUT } from '../utils/constants';
import { retryWithBackoff, createTimeoutSignal } from '../utils/helpers';

export class AirtableAPI {
    private plugin!: Plugin;
    private apiKey: string;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.apiKey = plugin.settings.airtableApiKey;
    }

    async fetchRecords(): Promise<AirtableRecord[]> {
        if (!this.apiKey) {
            throw new Error('Airtable API key not configured');
        }

        const records: AirtableRecord[] = [];
        
        for (const baseId of this.plugin.settings.airtableBaseIds) {
            try {
                const baseRecords = await this.fetchRecordsFromBase(baseId);
                records.push(...baseRecords);
            } catch (error) {
                console.error(`Failed to fetch records from base ${baseId}:`, error);
            }
        }

        return records;
    }

    private async fetchRecordsFromBase(baseId: string): Promise<AirtableRecord[]> {
        // First, get all tables in the base
        const tables = await this.getTablesInBase(baseId);
        const records: AirtableRecord[] = [];

        for (const table of tables) {
            try {
                const tableRecords = await this.fetchRecordsFromTable(baseId, table.id);
                records.push(...tableRecords);
            } catch (error) {
                console.error(`Failed to fetch records from table ${table.id} in base ${baseId}:`, error);
            }
        }

        return records;
    }

    private async getTablesInBase(baseId: string): Promise<Array<{ id: string; name: string }>> {
        try {
            const response = await retryWithBackoff(async () => {
                const url = `${AIRTABLE_API_BASE}/meta/bases/${baseId}/tables`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT);
                
                const fetchResponse = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!fetchResponse.ok) {
                    throw new Error(`Airtable API error: ${fetchResponse.status} ${fetchResponse.statusText}`);
                }

                return fetchResponse.json();
            });

            return response.tables.map((table: any) => ({
                id: table.id,
                name: table.name
            }));
        } catch (error) {
            console.error(`Failed to get tables for base ${baseId}:`, error);
            return [];
        }
    }

    private async fetchRecordsFromTable(baseId: string, tableId: string): Promise<AirtableRecord[]> {
        const records: AirtableRecord[] = [];
        let offset: string | undefined;

        do {
            try {
                const response = await retryWithBackoff(async () => {
                    let url = `${AIRTABLE_API_BASE}/${baseId}/${tableId}?maxRecords=100`;
                    if (offset) {
                        url += `&offset=${offset}`;
                    }

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT);

                    const fetchResponse = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!fetchResponse.ok) {
                        throw new Error(`Airtable API error: ${fetchResponse.status} ${fetchResponse.statusText}`);
                    }

                    return fetchResponse.json();
                });

                for (const record of response.records) {
                    records.push({
                        id: record.id,
                        fields: record.fields,
                        createdAt: new Date(record.createdTime),
                        updatedAt: new Date(record.createdTime), // Airtable doesn't provide last modified time in basic API
                        baseId: baseId,
                        tableId: tableId
                    });
                }

                offset = response.offset;
            } catch (error) {
                console.error(`Failed to fetch records from table ${tableId}:`, error);
                break;
            }
        } while (offset);

        return records;
    }

    async testConnection(): Promise<boolean> {
        try {
            // Test connection by trying to access the first base
            if (this.plugin.settings.airtableBaseIds.length === 0) {
                return false;
            }

            const baseId = this.plugin.settings.airtableBaseIds[0];
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT);
            
            const response = await fetch(`${AIRTABLE_API_BASE}/meta/bases/${baseId}/tables`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.error('Airtable connection test failed:', error);
            return false;
        }
    }

    // Helper method to extract text content from Airtable fields
    extractTextFromFields(fields: Record<string, any>): string {
        const textParts: string[] = [];

        for (const [fieldName, fieldValue] of Object.entries(fields)) {
            if (fieldValue === null || fieldValue === undefined) {
                continue;
            }

            if (typeof fieldValue === 'string') {
                textParts.push(`${fieldName}: ${fieldValue}`);
            } else if (typeof fieldValue === 'number') {
                textParts.push(`${fieldName}: ${fieldValue}`);
            } else if (Array.isArray(fieldValue)) {
                // Handle arrays (like multi-select fields)
                const arrayText = fieldValue.join(', ');
                textParts.push(`${fieldName}: ${arrayText}`);
            } else if (typeof fieldValue === 'object') {
                // Handle objects (like attachments, linked records)
                if (fieldValue.url) {
                    textParts.push(`${fieldName}: ${fieldValue.url}`);
                } else {
                    textParts.push(`${fieldName}: ${JSON.stringify(fieldValue)}`);
                }
            }
        }

        return textParts.join('\n');
    }
}

