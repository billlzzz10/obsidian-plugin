import { Plugin } from 'obsidian';
import { MCPServiceConfig } from '../../settings';

export class MCPServiceManager {
    private plugin: Plugin;
    private activeServices: Map<string, MCPService> = new Map();

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async initialize(): Promise<void> {
        console.log('MCPServiceManager initialized.');
    }

    async startService(config: MCPServiceConfig): Promise<boolean> {
        try {
            if (this.activeServices.has(config.name)) {
                console.log(`MCP Service ${config.name} is already running`);
                return true;
            }

            const service = new MCPService(config);
            const success = await service.start();

            if (success) {
                this.activeServices.set(config.name, service);
                console.log(`MCP Service ${config.name} started successfully`);
                return true;
            }

            return false;
        } catch (error) {
            console.error(`Failed to start MCP Service ${config.name}:`, error);
            return false;
        }
    }

    async stopService(serviceName: string): Promise<boolean> {
        try {
            const service = this.activeServices.get(serviceName);
            if (!service) {
                console.log(`MCP Service ${serviceName} is not running`);
                return true;
            }

            const success = await service.stop();
            if (success) {
                this.activeServices.delete(serviceName);
                console.log(`MCP Service ${serviceName} stopped successfully`);
            }

            return success;
        } catch (error) {
            console.error(`Failed to stop MCP Service ${serviceName}:`, error);
            return false;
        }
    }

    async restartService(serviceName: string): Promise<boolean> {
        const service = this.activeServices.get(serviceName);
        if (!service) {
            console.log(`MCP Service ${serviceName} is not running`);
            return false;
        }

        const config = service.getConfig();
        await this.stopService(serviceName);
        return await this.startService(config);
    }

    getServiceStatus(serviceName: string): 'running' | 'stopped' | 'error' {
        const service = this.activeServices.get(serviceName);
        return service ? service.getStatus() : 'stopped';
    }

    async sendRequest(serviceName: string, method: string, params: any): Promise<any> {
        const service = this.activeServices.get(serviceName);
        if (!service) {
            throw new Error(`MCP Service ${serviceName} is not running`);
        }

        return await service.sendRequest(method, params);
    }

    getAllServiceStatuses(): Record<string, 'running' | 'stopped' | 'error'> {
        const statuses: Record<string, 'running' | 'stopped' | 'error'> = {};

        for (const [name, service] of this.activeServices) {
            statuses[name] = service.getStatus();
        }

        return statuses;
    }

    // No global settings access here; service headers come from config.
}

class MCPService {
    private config: MCPServiceConfig;
    private status: 'running' | 'stopped' | 'error' = 'stopped';
    private process?: any;
    private connection?: any;

    constructor(config: MCPServiceConfig) {
        this.config = config;
    }

    async start(): Promise<boolean> {
        try {
            if (this.config.type === 'stdio') {
                return await this.startStdioService();
            } else if (this.config.type === 'http') {
                return await this.startHttpService();
            }
            return false;
        } catch (error) {
            console.error(`Failed to start ${this.config.name}:`, error);
            this.status = 'error';
            return false;
        }
    }

    private async startStdioService(): Promise<boolean> {
        // สำหรับ Notion MCP Server
        if (!this.config.command || !this.config.args) {
            throw new Error('Stdio service requires command and args');
        }

        try {
            // ใน Obsidian Plugin, เราไม่สามารถ spawn child process ได้โดยตรง
            // ต้องใช้วิธีอื่น เช่น Web Worker หรือ iframe
            console.log(`Starting stdio service: ${this.config.command} ${this.config.args.join(' ')}`);

            // สำหรับตอนนี้ให้ mock การทำงาน
            this.status = 'running';
            return true;
        } catch (error) {
            console.error('Failed to start stdio service:', error);
            this.status = 'error';
            return false;
        }
    }

    private async startHttpService(): Promise<boolean> {
        // สำหรับ Zapier และ Figma MCP Services
        if (!this.config.url) {
            throw new Error('HTTP service requires URL');
        }

        try {
            // ทดสอบการเชื่อมต่อ
            const response = await fetch(this.config.url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    ...(this.config.headers || {})
                }
            });

            if (response.ok) {
                console.log(`HTTP service ${this.config.name} is accessible`);
                this.status = 'running';
                return true;
            } else {
                console.error(`HTTP service ${this.config.name} returned status: ${response.status}`);
                this.status = 'error';
                return false;
            }
        } catch (error) {
            console.error(`Failed to connect to HTTP service ${this.config.name}:`, error);
            this.status = 'error';
            return false;
        }
    }

    async stop(): Promise<boolean> {
        try {
            if (this.process) {
                // Stop child process if any
                this.process = null;
            }

            if (this.connection) {
                // Close connection if any
                this.connection = null;
            }

            this.status = 'stopped';
            return true;
        } catch (error) {
            console.error(`Failed to stop service ${this.config.name}:`, error);
            return false;
        }
    }

    async sendRequest(method: string, params: any): Promise<any> {
        if (this.status !== 'running') {
            throw new Error(`Service ${this.config.name} is not running`);
        }

        try {
            if (this.config.type === 'http') {
                return await this.sendHttpRequest(method, params);
            } else {
                return await this.sendStdioRequest(method, params);
            }
        } catch (error) {
            console.error(`Failed to send request to ${this.config.name}:`, error);
            throw error;
        }
    }

    private async sendHttpRequest(method: string, params: any): Promise<any> {
        const response = await fetch(this.config.url!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.headers || {})
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method: method,
                params: params
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    private async sendStdioRequest(method: string, params: any): Promise<any> {
        // สำหรับ stdio services จะต้องส่งผ่าน process stdin/stdout
        // ตอนนี้ให้ mock การทำงาน
        console.log(`Sending stdio request: ${method}`, params);
        return { result: `Mock response for ${method}` };
    }

    getStatus(): 'running' | 'stopped' | 'error' {
        return this.status;
    }

    getConfig(): MCPServiceConfig {
        return this.config;
    }
}

export { MCPService };
