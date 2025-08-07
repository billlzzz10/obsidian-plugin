import { Plugin } from 'obsidian';
import { ChatService } from '../chat/ChatService';

interface Tool {
    id: string;
    name: string;
    description: string;
    parameters: ToolParameter[];
    handler: (params: Record<string, any>) => Promise<any>;
    category: string;
}

interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default?: any;
}

export class ToolManager {
    private plugin!: Plugin;
    private chatService!: ChatService;
    private tools: Map<string, Tool> = new Map();

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async initialize() {
        this.chatService = this.plugin.chatService;
        this.loadBuiltInTools();
        this.loadCustomTools();
        console.log('ToolManager initialized.');
    }

    private loadBuiltInTools() {
        const builtInTools: Tool[] = [
            {
                id: 'search_notes',
                name: 'Search Notes',
                description: 'Search through Obsidian notes using semantic search',
                parameters: [
                    {
                        name: 'query',
                        type: 'string',
                        description: 'Search query',
                        required: true
                    },
                    {
                        name: 'maxResults',
                        type: 'number',
                        description: 'Maximum number of results',
                        required: false,
                        default: 5
                    }
                ],
                handler: this.searchNotes.bind(this),
                category: 'Search'
            },
            {
                id: 'create_note',
                name: 'Create Note',
                description: 'Create a new note with specified content',
                parameters: [
                    {
                        name: 'title',
                        type: 'string',
                        description: 'Note title',
                        required: true
                    },
                    {
                        name: 'content',
                        type: 'string',
                        description: 'Note content',
                        required: true
                    },
                    {
                        name: 'folder',
                        type: 'string',
                        description: 'Folder path (optional)',
                        required: false
                    }
                ],
                handler: this.createNote.bind(this),
                category: 'File Operations'
            },
            {
                id: 'get_note_content',
                name: 'Get Note Content',
                description: 'Retrieve the content of a specific note',
                parameters: [
                    {
                        name: 'notePath',
                        type: 'string',
                        description: 'Path to the note',
                        required: true
                    }
                ],
                handler: this.getNoteContent.bind(this),
                category: 'File Operations'
            },
            {
                id: 'update_note',
                name: 'Update Note',
                description: 'Update the content of an existing note',
                parameters: [
                    {
                        name: 'notePath',
                        type: 'string',
                        description: 'Path to the note',
                        required: true
                    },
                    {
                        name: 'content',
                        type: 'string',
                        description: 'New content',
                        required: true
                    },
                    {
                        name: 'append',
                        type: 'boolean',
                        description: 'Append to existing content instead of replacing',
                        required: false,
                        default: false
                    }
                ],
                handler: this.updateNote.bind(this),
                category: 'File Operations'
            },
            {
                id: 'list_notes',
                name: 'List Notes',
                description: 'List notes in a specific folder or with specific tags',
                parameters: [
                    {
                        name: 'folder',
                        type: 'string',
                        description: 'Folder path (optional)',
                        required: false
                    },
                    {
                        name: 'tags',
                        type: 'array',
                        description: 'Tags to filter by (optional)',
                        required: false
                    }
                ],
                handler: this.listNotes.bind(this),
                category: 'File Operations'
            },
            {
                id: 'sync_external_data',
                name: 'Sync External Data',
                description: 'Sync data from Notion and Airtable',
                parameters: [],
                handler: this.syncExternalData.bind(this),
                category: 'Data Management'
            },
            {
                id: 'rebuild_embeddings',
                name: 'Rebuild Embeddings',
                description: 'Rebuild all embeddings for RAG',
                parameters: [],
                handler: this.rebuildEmbeddings.bind(this),
                category: 'Data Management'
            }
        ];

        builtInTools.forEach(tool => {
            this.tools.set(tool.id, tool);
        });
    }

    private loadCustomTools() {
        const customTools = this.plugin.settings.customTools || [];
        customTools.forEach((toolConfig: any) => {
            try {
                const tool: Tool = {
                    id: toolConfig.id,
                    name: toolConfig.name,
                    description: toolConfig.description,
                    parameters: toolConfig.parameters,
                    handler: this.createCustomToolHandler(toolConfig),
                    category: toolConfig.category || 'Custom'
                };
                this.tools.set(tool.id, tool);
            } catch (error) {
                console.error(`Failed to load custom tool ${toolConfig.id}:`, error);
            }
        });
    }

    private createCustomToolHandler(toolConfig: any): (params: Record<string, any>) => Promise<any> {
        return async (params: Record<string, any>) => {
            // For custom tools defined in JSON, we can execute simple operations
            // or delegate to external APIs/scripts
            if (toolConfig.type === 'api') {
                return this.executeApiTool(toolConfig, params);
            } else if (toolConfig.type === 'script') {
                return this.executeScriptTool(toolConfig, params);
            } else {
                throw new Error(`Unsupported custom tool type: ${toolConfig.type}`);
            }
        };
    }

    private async executeApiTool(toolConfig: any, params: Record<string, any>): Promise<any> {
        const { endpoint, method = 'POST', headers = {} } = toolConfig;

        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error(`API tool failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    private async executeScriptTool(_toolConfig: any, _params: Record<string, any>): Promise<any> {
        // For security reasons, script execution should be limited
        // This is a placeholder for potential script execution functionality
        throw new Error('Script tools are not yet implemented for security reasons');
    }

    // Built-in tool handlers
    private async searchNotes(params: Record<string, any>): Promise<any> {
        const { query, maxResults = 5 } = params;
        const sources = await this.plugin.ragService.getRelevantSources(query, maxResults);

        return {
            results: sources.map(source => ({
                title: source.title,
                path: source.path,
                content: source.content.substring(0, 200) + '...',
                similarity: source.similarity
            }))
        };
    }

    private async createNote(params: Record<string, any>): Promise<any> {
        const { title, content, folder } = params;
        const path = folder ? `${folder}/${title}.md` : `${title}.md`;

        try {
            await this.plugin.app.vault.create(path, content);
            return { success: true, path: path };
        } catch (error) {
            throw new Error(`Failed to create note: ${(error as Error).message}`);
        }
    }

    private async getNoteContent(params: Record<string, any>): Promise<any> {
        const { notePath } = params;

        try {
            const file = this.plugin.app.vault.getAbstractFileByPath(notePath);
            if (!file) {
                throw new Error(`Note not found: ${notePath}`);
            }

            const content = await this.plugin.app.vault.read(file as any);
            return { content: content };
        } catch (error) {
            throw new Error(`Failed to read note: ${(error as Error).message}`);
        }
    }

    private async updateNote(params: Record<string, any>): Promise<any> {
        const { notePath, content, append = false } = params;

        try {
            const file = this.plugin.app.vault.getAbstractFileByPath(notePath);
            if (!file) {
                throw new Error(`Note not found: ${notePath}`);
            }

            let newContent = content;
            if (append) {
                const existingContent = await this.plugin.app.vault.read(file as any);
                newContent = existingContent + '\n\n' + content;
            }

            await this.plugin.app.vault.modify(file as any, newContent);
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to update note: ${(error as Error).message}`);
        }
    }

    private async listNotes(params: Record<string, any>): Promise<any> {
        const { folder } = params;

        let files = this.plugin.app.vault.getMarkdownFiles();

        if (folder) {
            files = files.filter(file => file.path.startsWith(folder));
        }

        // TODO: Implement tag filtering

        return {
            notes: files.map(file => ({
                path: file.path,
                name: file.basename,
                created: file.stat.ctime,
                modified: file.stat.mtime
            }))
        };
    }

    private async syncExternalData(_params: Record<string, any>): Promise<any> {
        try {
            await this.plugin.dataIngestionManager.syncExternalData();
            return { success: true, message: 'External data synced successfully' };
        } catch (error) {
            throw new Error(`Failed to sync external data: ${(error as Error).message}`);
        }
    }

    private async rebuildEmbeddings(_params: Record<string, any>): Promise<any> {
        try {
            await this.plugin.embeddingManager.rebuildEmbeddings();
            return { success: true, message: 'Embeddings rebuilt successfully' };
        } catch (error) {
            throw new Error(`Failed to rebuild embeddings: ${(error as Error).message}`);
        }
    }

    async executeTool(toolId: string, params: Record<string, any>): Promise<any> {
        const tool = this.tools.get(toolId);
        if (!tool) {
            throw new Error(`Tool '${toolId}' not found`);
        }

        // Validate parameters
        this.validateParameters(tool, params);

        try {
            return await tool.handler(params);
        } catch (error) {
            console.error(`Tool execution failed for ${toolId}:`, error);
            throw error;
        }
    }

    private validateParameters(tool: Tool, params: Record<string, any>): void {
        for (const param of tool.parameters) {
            if (param.required && !(param.name in params)) {
                throw new Error(`Required parameter '${param.name}' is missing for tool '${tool.id}'`);
            }

            if (param.name in params) {
                const value = params[param.name];
                const expectedType = param.type;

                if (expectedType === 'number' && typeof value !== 'number') {
                    throw new Error(`Parameter '${param.name}' must be a number`);
                } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
                    throw new Error(`Parameter '${param.name}' must be a boolean`);
                } else if (expectedType === 'array' && !Array.isArray(value)) {
                    throw new Error(`Parameter '${param.name}' must be an array`);
                } else if (expectedType === 'object' && typeof value !== 'object') {
                    throw new Error(`Parameter '${param.name}' must be an object`);
                }
            }
        }
    }

    getAvailableTools(): Tool[] {
        return Array.from(this.tools.values());
    }

    getToolsByCategory(category: string): Tool[] {
        return Array.from(this.tools.values()).filter(tool => tool.category === category);
    }

    getCategories(): string[] {
        const categories = new Set<string>();
        this.tools.forEach(tool => categories.add(tool.category));
        return Array.from(categories);
    }

    async addCustomTool(toolConfig: any): Promise<void> {
        const customTools = this.plugin.settings.customTools || [];
        const existingIndex = customTools.findIndex((t: {id: string}) => t.id === toolConfig.id);

        if (existingIndex >= 0) {
            customTools[existingIndex] = toolConfig;
        } else {
            customTools.push(toolConfig);
        }

        this.plugin.settings.customTools = customTools;
        await this.plugin.saveData(this.plugin.settings);

        // Reload tools
        this.loadCustomTools();
    }

    async removeCustomTool(toolId: string): Promise<void> {
        this.tools.delete(toolId);
        this.plugin.settings.customTools =
            (this.plugin.settings.customTools || []).filter((t: {id: string}) => t.id !== toolId);
        await this.plugin.saveData(this.plugin.settings);
    }

    async cleanup() {
        this.tools.clear();
        console.log('ToolManager cleaned up.');
    }
}

