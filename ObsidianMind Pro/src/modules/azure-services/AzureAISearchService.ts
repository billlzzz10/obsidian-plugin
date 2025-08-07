import { Plugin } from 'obsidian';

// ตัวเลือกการตั้งค่าสำหรับ Azure AI Search
export interface AzureAISearchConfig {
    endpoint: string;
    apiKey: string;
    indexName: string;
    apiVersion: string;
}

// Interface สำหรับเอกสารที่จะส่งไปยัง Azure AI Search
export interface SearchDocument {
    id: string;
    content: string;
    title: string;
    [key: string]: any; // รองรับฟิลด์เพิ่มเติม
}

// Interface สำหรับผลลัพธ์การค้นหา
export interface SearchResult {
    id: string;
    content: string;
    title: string;
    score: number;
    [key: string]: any; // รองรับฟิลด์เพิ่มเติม
}

// คลาสสำหรับเชื่อมต่อกับ Azure AI Search
export class AzureAISearchService {
    private plugin: Plugin;
    private config: AzureAISearchConfig;

    constructor(plugin: Plugin, config: AzureAISearchConfig) {
        this.plugin = plugin;
        this.config = config;
    }

    async initialize() {
        // ตรวจสอบการตั้งค่า
        if (!this.isConfigured()) {
            console.warn('Azure AI Search Service is not fully configured.');
            return;
        }

        console.log('Azure AI Search Service initialized.');
    }

    // ส่งเอกสารไปยัง Azure AI Search
    async indexDocument(document: SearchDocument): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('Azure AI Search Service is not fully configured. Please check your settings.');
        }

        try {
            // สร้าง URL สำหรับเรียก API
            const url = `${this.config.endpoint}/indexes/${this.config.indexName}/docs/index?api-version=${this.config.apiVersion}`;

            // สร้าง payload สำหรับส่งเอกสาร
            const payload = {
                value: [document]
            };

            // เรียก API
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Azure AI Search API error: ${response.status} ${response.statusText}`);
            }

            console.log(`Document ${document.id} indexed successfully.`);
        } catch (error) {
            console.error('Azure AI Search indexing error:', error);
            throw error;
        }
    }

    // ค้นหาเอกสารจาก Azure AI Search
    async search(query: string, filter?: string, top: number = 10): Promise<SearchResult[]> {
        if (!this.isConfigured()) {
            throw new Error('Azure AI Search Service is not fully configured. Please check your settings.');
        }

        try {
            // สร้าง URL สำหรับเรียก API
            const url = `${this.config.endpoint}/indexes/${this.config.indexName}/docs/search?api-version=${this.config.apiVersion}`;

            // สร้าง payload สำหรับการค้นหา
            const payload: any = {
                search: query,
                top: top,
                queryType: 'semantic',
                semanticConfiguration: 'default',
                select: '*'
            };

            // เพิ่ม filter ถ้ามี
            if (filter) {
                payload.filter = filter;
            }

            // เรียก API
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Azure AI Search API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            // แปลงผลลัพธ์เป็นรูปแบบที่ต้องการ
            return (result.value || []).map((item: any) => ({
                id: item.id || '',
                content: item.content || '',
                title: item.title || '',
                score: item['@search.score'] || 0,
                ...item // รวมฟิลด์อื่นๆ ทั้งหมด
            }));
        } catch (error) {
            console.error('Azure AI Search error:', error);
            throw error;
        }
    }

    // Batch indexing สำหรับส่งหลายเอกสารพร้อมกัน
    async indexBatch(documents: SearchDocument[]): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('Azure AI Search Service is not fully configured. Please check your settings.');
        }

        if (!documents || documents.length === 0) {
            console.warn('No documents to index.');
            return;
        }

        try {
            // สร้าง URL สำหรับเรียก API
            const url = `${this.config.endpoint}/indexes/${this.config.indexName}/docs/index?api-version=${this.config.apiVersion}`;

            // สร้าง payload สำหรับส่งเอกสาร
            const payload = {
                value: documents
            };

            // เรียก API
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Azure AI Search API error: ${response.status} ${response.statusText}`);
            }

            console.log(`${documents.length} documents indexed successfully.`);
        } catch (error) {
            console.error('Azure AI Search batch indexing error:', error);
            throw error;
        }
    }

    // ตรวจสอบว่ามีการตั้งค่าครบถ้วนหรือไม่
    isConfigured(): boolean {
        return !!(this.config.endpoint && this.config.apiKey && this.config.indexName && this.config.apiVersion);
    }

    // อัปเดตการตั้งค่า
    updateConfig(config: Partial<AzureAISearchConfig>): void {
        this.config = { ...this.config, ...config };
    }
}
