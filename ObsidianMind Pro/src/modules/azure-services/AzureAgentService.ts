import { Plugin } from 'obsidian';

// ตัวเลือกการตั้งค่าสำหรับ Azure Agent Service
export interface AzureAgentConfig {
    endpoint: string;
    apiKey: string;
    agentName: string;
    apiVersion: string;
}

// Interface สำหรับ Template ของเอกสาร
export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    sections: DocumentSection[];
}

// Interface สำหรับส่วนต่างๆ ของเอกสาร
export interface DocumentSection {
    id: string;
    title: string;
    prompt: string;
    order: number;
}

// คลาสสำหรับเชื่อมต่อกับ Azure AI Projects Agent
export class AzureAgentService {
    private plugin: Plugin;
    private config: AzureAgentConfig;

    constructor(plugin: Plugin, config: AzureAgentConfig) {
        this.plugin = plugin;
        this.config = config;
    }

    async initialize() {
        // ตรวจสอบการตั้งค่า
        if (!this.isConfigured()) {
            console.warn('Azure Agent Service is not fully configured.');
            return;
        }

        console.log('Azure Agent Service initialized.');
    }

    // สร้างเอกสารโดยใช้ Agent
    async generateDocument(template: DocumentTemplate, context: any): Promise<string> {
        if (!this.isConfigured()) {
            throw new Error('Azure Agent Service is not fully configured. Please check your settings.');
        }

        try {
            // สร้าง URL สำหรับเรียก API
            const url = `${this.config.endpoint}/agents/${this.config.agentName}/execute?api-version=${this.config.apiVersion}`;

            // สร้าง payload สำหรับส่งให้ Agent
            const payload = {
                template: template,
                context: context
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
                throw new Error(`Azure Agent API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            // สร้างเอกสารในรูปแบบ Markdown จากผลลัพธ์
            return this.formatDocumentMarkdown(result);
        } catch (error) {
            console.error('Azure Agent Service error:', error);
            throw error;
        }
    }

    // แปลงผลลัพธ์จาก Agent เป็น Markdown
    private formatDocumentMarkdown(result: any): string {
        // ตัวอย่างการแปลงผลลัพธ์เป็น Markdown
        let markdown = `# ${result.title || 'Generated Document'}\n\n`;

        if (result.sections) {
            for (const section of result.sections) {
                markdown += `## ${section.title || 'Section'}\n\n`;
                markdown += `${section.content || ''}\n\n`;
            }
        }

        return markdown;
    }

    // ดึงรายการเทมเพลตที่มีอยู่
    async listTemplates(): Promise<DocumentTemplate[]> {
        if (!this.isConfigured()) {
            throw new Error('Azure Agent Service is not fully configured. Please check your settings.');
        }

        try {
            // สร้าง URL สำหรับเรียก API
            const url = `${this.config.endpoint}/templates?api-version=${this.config.apiVersion}`;

            // เรียก API
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Azure Agent API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result.templates || [];
        } catch (error) {
            console.error('Azure Agent Service error:', error);
            throw error;
        }
    }

    // ตรวจสอบว่ามีการตั้งค่าครบถ้วนหรือไม่
    isConfigured(): boolean {
        return !!(this.config.endpoint && this.config.apiKey && this.config.agentName && this.config.apiVersion);
    }

    // อัปเดตการตั้งค่า
    updateConfig(config: Partial<AzureAgentConfig>): void {
        this.config = { ...this.config, ...config };
    }
}
