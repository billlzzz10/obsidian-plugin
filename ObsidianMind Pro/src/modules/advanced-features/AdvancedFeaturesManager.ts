import { Plugin } from 'obsidian';
import { TemplaterIntegration } from './TemplaterIntegration';
import { PromptGenerator } from './PromptGenerator';
import { ToolManager } from './ToolManager';
import { MacroCommandProcessor } from './MacroCommandProcessor';

export class AdvancedFeaturesManager {
    private plugin!: Plugin;
    public templaterIntegration: TemplaterIntegration;
    public promptGenerator: PromptGenerator;
    public toolManager: ToolManager;
    public macroCommandProcessor: MacroCommandProcessor;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.templaterIntegration = new TemplaterIntegration(plugin);
        this.promptGenerator = new PromptGenerator(plugin);
        this.toolManager = new ToolManager(plugin);
        this.macroCommandProcessor = new MacroCommandProcessor(plugin);
    }

    async initialize() {
        await this.templaterIntegration.initialize();
        await this.promptGenerator.initialize();
        await this.toolManager.initialize();
        await this.macroCommandProcessor.initialize();
        console.log('AdvancedFeaturesManager initialized.');
    }

    async cleanup() {
        await this.templaterIntegration.cleanup();
        await this.promptGenerator.cleanup();
        await this.toolManager.cleanup();
        await this.macroCommandProcessor.cleanup();
        console.log('AdvancedFeaturesManager cleaned up.');
    }
}

