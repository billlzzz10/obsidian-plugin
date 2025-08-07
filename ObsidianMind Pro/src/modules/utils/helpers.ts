import { TFile, Plugin } from "obsidian";
import { PluginError, ERROR_CODES } from "./types";

export function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function chunkText(text: string, chunkSize: number, chunkOverlap: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        const chunk = text.substring(i, Math.min(i + chunkSize, text.length));
        chunks.push(chunk);
        i += chunkSize - chunkOverlap;
        if (i < 0) i = 0; // Ensure i doesn't go negative
    }
    return chunks;
}

export function validateApiKey(apiKey: string, provider: string): boolean {
    if (!apiKey || apiKey.trim() === "") {
        return false;
    }
    // Basic validation based on provider
    switch (provider) {
        case "openai":
            return apiKey.startsWith("sk-");
        case "anthropic":
            return apiKey.startsWith("sk-ant-");
        case "google":
            return apiKey.startsWith("AI");
        default:
            return true; // Assume valid for unknown providers
    }
}

export async function getObsidianFileContent(plugin: Plugin, filePath: string): Promise<string> {
    const file = plugin.app.vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile)) {
        throw new PluginError(`File not found or is not a note: ${filePath}`, ERROR_CODES.OBSIDIAN_API_ERROR);
    }
    return plugin.app.vault.read(file);
}

export function getObsidianFiles(plugin: Plugin): TFile[] {
    return plugin.app.vault.getMarkdownFiles();
}

export function getObsidianNoteMetadata(plugin: Plugin, file: TFile): { createdAt: Date, updatedAt: Date, tags: string[] } {
    const cache = plugin.app.metadataCache.getFileCache(file);
    const tags = cache?.tags?.map((tag: { tag: string }) => tag.tag.replace(/^#/, "")) || [];
    return {
        createdAt: new Date(file.stat.ctime),
        updatedAt: new Date(file.stat.mtime),
        tags: tags
    };
}

export async function getActiveFileContent(plugin: Plugin): Promise<string> {
    const activeFile = plugin.app.workspace.getActiveFile();
    if (!activeFile) {
        throw new PluginError("No active file to get content from.", ERROR_CODES.OBSIDIAN_API_ERROR);
    }
    return plugin.app.vault.read(activeFile);
}

export function getActiveFile(plugin: Plugin): TFile | null {
    return plugin.app.workspace.getActiveFile();
}

export function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            if (attempt === maxRetries) {
                throw lastError;
            }
            
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError!;
}

// Polyfill for AbortSignal.timeout if not available
export function createTimeoutSignal(timeout: number): AbortSignal {
    try {
        // Try using the native AbortSignal.timeout if available
        if (typeof (AbortSignal as any).timeout === 'function') {
            return (AbortSignal as any).timeout(timeout);
        }
    } catch (e) {
        // Fallback if not available
    }
    
    // Fallback implementation
    const controller = new AbortController();
    setTimeout(() => {
        controller.abort();
    }, timeout);
    return controller.signal;
}


