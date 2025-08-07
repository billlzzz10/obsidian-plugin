// Mock for Obsidian API
export class TFile {
    path: string;
    name: string;
    stat: { ctime: number; mtime: number };

    constructor(path: string) {
        this.path = path;
        this.name = path.split('/').pop() || '';
        this.stat = { ctime: Date.now(), mtime: Date.now() };
    }
}

export class Plugin {
    app: any;
    manifest: any;

    constructor() {
        this.app = {
            vault: {
                getAbstractFileByPath: jest.fn(),
                read: jest.fn(),
                getMarkdownFiles: jest.fn(() => [])
            },
            metadataCache: {
                getFileCache: jest.fn(() => ({ tags: [] }))
            },
            workspace: {
                getActiveFile: jest.fn()
            }
        };
        this.manifest = { version: '1.0.0' };
    }

    async loadData() {
        return {};
    }

    async saveData(data: any) {
        return Promise.resolve();
    }
}