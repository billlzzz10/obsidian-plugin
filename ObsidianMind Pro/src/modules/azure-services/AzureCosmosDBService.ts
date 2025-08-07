import { Plugin } from 'obsidian';

// ตัวเลือกการตั้งค่าสำหรับ Azure Cosmos DB
export interface AzureCosmosDBConfig {
    endpoint: string;
    key: string;
    databaseId: string;
    containerId: string;
}

// Interface สำหรับประวัติการสนทนา
export interface ChatHistory {
    id: string;
    userId: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

// Interface สำหรับข้อความในการสนทนา
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// คลาสสำหรับเชื่อมต่อกับ Azure Cosmos DB
export class AzureCosmosDBService {
    private plugin: Plugin;
    private config: AzureCosmosDBConfig;

    constructor(plugin: Plugin, config: AzureCosmosDBConfig) {
        this.plugin = plugin;
        this.config = config;
    }

    async initialize() {
        // ตรวจสอบการตั้งค่า
        if (!this.isConfigured()) {
            console.warn('Azure Cosmos DB Service is not fully configured.');
            return;
        }

        console.log('Azure Cosmos DB Service initialized.');
    }

    // บันทึกประวัติการสนทนา
    async saveChatHistory(history: ChatHistory): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('Azure Cosmos DB Service is not fully configured. Please check your settings.');
        }

        try {
            const url = `${this.config.endpoint}/dbs/${this.config.databaseId}/colls/${this.config.containerId}/docs`;

            // ปรับรูปแบบวันที่สำหรับส่งไป Cosmos DB (ต้องเป็น string)
            const historyToSave = {
                ...history,
                createdAt: history.createdAt.toISOString(),
                updatedAt: history.updatedAt.toISOString(),
                messages: history.messages.map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp.toISOString()
                }))
            };

            // สร้าง Authorization header
            const date = new Date().toUTCString();
            const authHeader = this.generateAuthHeader('post', 'docs', 'colls', `dbs/${this.config.databaseId}/colls/${this.config.containerId}`, date);

            // เรียก API
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'x-ms-date': date,
                    'x-ms-version': '2018-12-31'
                },
                body: JSON.stringify(historyToSave)
            });

            if (!response.ok) {
                throw new Error(`Azure Cosmos DB API error: ${response.status} ${response.statusText}`);
            }

            console.log(`Chat history ${history.id} saved successfully.`);
        } catch (error) {
            console.error('Azure Cosmos DB Service error:', error);
            throw error;
        }
    }

    // ดึงประวัติการสนทนาทั้งหมดของผู้ใช้
    async getChatHistoryByUser(userId: string): Promise<ChatHistory[]> {
        if (!this.isConfigured()) {
            throw new Error('Azure Cosmos DB Service is not fully configured. Please check your settings.');
        }

        try {
            const url = `${this.config.endpoint}/dbs/${this.config.databaseId}/colls/${this.config.containerId}/docs`;

            // สร้าง Authorization header
            const date = new Date().toUTCString();
            const authHeader = this.generateAuthHeader('get', 'docs', 'colls', `dbs/${this.config.databaseId}/colls/${this.config.containerId}`, date);

            // เรียก API พร้อมกับ query เพื่อกรองเฉพาะประวัติของผู้ใช้ที่ต้องการ
            const queryUrl = `${url}?query=SELECT * FROM c WHERE c.userId = @userId`;

            const response = await fetch(queryUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/query+json',
                    'Authorization': authHeader,
                    'x-ms-date': date,
                    'x-ms-version': '2018-12-31',
                    'x-ms-documentdb-isquery': 'true',
                    'x-ms-documentdb-query-enablecrosspartition': 'true'
                },
                body: JSON.stringify({
                    query: 'SELECT * FROM c WHERE c.userId = @userId',
                    parameters: [
                        { name: '@userId', value: userId }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Azure Cosmos DB API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            // แปลงผลลัพธ์ให้อยู่ในรูปแบบที่ต้องการ โดยแปลงวันที่กลับเป็น Date object
            return (result.Documents || []).map((doc: any) => ({
                ...doc,
                createdAt: new Date(doc.createdAt),
                updatedAt: new Date(doc.updatedAt),
                messages: (doc.messages || []).map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }))
            }));
        } catch (error) {
            console.error('Azure Cosmos DB Service error:', error);
            throw error;
        }
    }

    // ฟังก์ชันสำหรับสร้าง Authorization header
    private generateAuthHeader(_verb: string, _resourceType: string, _resourceLink: string, _resourceId: string, _date: string): string {
        // หมายเหตุ: นี่เป็นเพียงโครงร่างของฟังก์ชัน ในการใช้งานจริงต้องใช้ไลบรารีเพิ่มเติมในการสร้าง HMAC-SHA256
        // ในที่นี้จะใช้วิธีง่ายๆ แทน
        return `type=master&ver=1.0&sig=DUMMY-SIGNATURE`;
    }

    // ตรวจสอบว่ามีการตั้งค่าครบถ้วนหรือไม่
    isConfigured(): boolean {
        return !!(this.config.endpoint && this.config.key && this.config.databaseId && this.config.containerId);
    }

    // อัปเดตการตั้งค่า
    updateConfig(config: Partial<AzureCosmosDBConfig>): void {
        this.config = { ...this.config, ...config };
    }
}
