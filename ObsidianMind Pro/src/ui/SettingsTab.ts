import { App, PluginSettingTab, Setting } from 'obsidian';
import AIPlugin from '../main';
import { EMBEDDING_MODELS, SUPPORTED_MODELS } from '../modules/utils/constants';

export class AIPluginSettingTab extends PluginSettingTab {
    plugin: AIPlugin;

    constructor(app: App, plugin: AIPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Obsidian AI Plugin Settings' });

        // AI Model Settings
        containerEl.createEl('h3', { text: 'AI Model Settings' });

        new Setting(containerEl)
            .setName('Selected Model')
            .setDesc('Choose the AI model to use for chat')
            .addDropdown(dropdown => {
                // Add OpenAI models
                Object.keys(SUPPORTED_MODELS.OPENAI).forEach(model => {
                    dropdown.addOption(model, `OpenAI: ${model}`);
                });

                // Add Anthropic models
                Object.keys(SUPPORTED_MODELS.ANTHROPIC).forEach(model => {
                    dropdown.addOption(model, `Anthropic: ${model}`);
                });

                // Add Google models
                Object.keys(SUPPORTED_MODELS.GOOGLE).forEach(model => {
                    dropdown.addOption(model, `Google: ${model}`);
                });

                dropdown
                    .setValue(this.plugin.settings.selectedModel)
                    .onChange(async (value) => {
                        this.plugin.settings.selectedModel = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });

        new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('Your OpenAI API key (starts with sk-)')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.openaiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openaiApiKey = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Anthropic API Key')
            .setDesc('Your Anthropic API key (starts with sk-ant-)')
            .addText(text => text
                .setPlaceholder('sk-ant-...')
                .setValue(this.plugin.settings.anthropicApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.anthropicApiKey = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Google AI API Key')
            .setDesc('Your Google AI API key')
            .addText(text => text
                .setPlaceholder('AI...')
                .setValue(this.plugin.settings.googleApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.googleApiKey = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        // Embedding Settings
        containerEl.createEl('h3', { text: 'Embedding Settings' });

        new Setting(containerEl)
            .setName('Embedding Model')
            .setDesc('Choose the embedding model for RAG')
            .addDropdown(dropdown => {
                Object.entries(EMBEDDING_MODELS).forEach(([model, config]) => {
                    dropdown.addOption(model, `${model} (${config.dimensions}d, ${config.size})`);
                });

                dropdown
                    .setValue(this.plugin.settings.embeddingModel)
                    .onChange(async (value) => {
                        this.plugin.settings.embeddingModel = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });

        new Setting(containerEl)
            .setName('Chunk Size')
            .setDesc('Size of text chunks for embedding (100-2000 characters)')
            .addSlider(slider => slider
                .setLimits(100, 2000, 100)
                .setValue(this.plugin.settings.chunkSize)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.chunkSize = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Chunk Overlap')
            .setDesc('Overlap between chunks (0-500 characters)')
            .addSlider(slider => slider
                .setLimits(0, 500, 50)
                .setValue(this.plugin.settings.chunkOverlap)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.chunkOverlap = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        // RAG Settings
        containerEl.createEl('h3', { text: 'RAG Settings' });

        new Setting(containerEl)
            .setName('Max Retrieved Chunks')
            .setDesc('Maximum number of chunks to retrieve for context')
            .addSlider(slider => slider
                .setLimits(1, 20, 1)
                .setValue(this.plugin.settings.maxRetrievedChunks)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxRetrievedChunks = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Similarity Threshold')
            .setDesc('Minimum similarity score for retrieved chunks')
            .addSlider(slider => slider
                .setLimits(0.1, 1.0, 0.1)
                .setValue(this.plugin.settings.similarityThreshold)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.similarityThreshold = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        // External Integration Settings
        containerEl.createEl('h3', { text: 'External Integrations' });

        new Setting(containerEl)
            .setName('Notion Integration Token')
            .setDesc('Your Notion integration token')
            .addText(text => text
                .setPlaceholder('secret_...')
                .setValue(this.plugin.settings.notionIntegrationToken)
                .onChange(async (value) => {
                    this.plugin.settings.notionIntegrationToken = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Notion Database IDs')
            .setDesc('Comma-separated list of Notion database IDs')
            .addTextArea(text => text
                .setPlaceholder('database-id-1,database-id-2')
                .setValue(this.plugin.settings.notionDatabaseIds.join(','))
                .onChange(async (value) => {
                    this.plugin.settings.notionDatabaseIds = value.split(',').map(id => id.trim()).filter(id => id);
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Airtable API Key')
            .setDesc('Your Airtable Personal Access Token')
            .addText(text => text
                .setPlaceholder('pat...')
                .setValue(this.plugin.settings.airtableApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.airtableApiKey = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Airtable Base IDs')
            .setDesc('Comma-separated list of Airtable base IDs')
            .addTextArea(text => text
                .setPlaceholder('app...')
                .setValue(this.plugin.settings.airtableBaseIds.join(','))
                .onChange(async (value) => {
                    this.plugin.settings.airtableBaseIds = value.split(',').map(id => id.trim()).filter(id => id);
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Auto Sync')
            .setDesc('Automatically sync external data at regular intervals')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoSync)
                .onChange(async (value) => {
                    this.plugin.settings.autoSync = value;
                    await this.plugin.saveData(this.plugin.settings);
                    // Restart auto-sync with new setting
                    this.plugin.dataIngestionManager.startAutoSync();
                }));

        new Setting(containerEl)
            .setName('Sync Interval')
            .setDesc('Interval between automatic syncs (in minutes)')
            .addSlider(slider => slider
                .setLimits(5, 1440, 5)
                .setValue(this.plugin.settings.syncInterval)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.syncInterval = value;
                    await this.plugin.saveData(this.plugin.settings);
                    // Restart auto-sync with new interval
                    this.plugin.dataIngestionManager.startAutoSync();
                }));

        // Chat Settings
        containerEl.createEl('h3', { text: 'Chat Settings' });

        new Setting(containerEl)
            .setName('Max Chat History')
            .setDesc('Maximum number of messages to keep in chat history')
            .addSlider(slider => slider
                .setLimits(10, 100, 5)
                .setValue(this.plugin.settings.maxChatHistory)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxChatHistory = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Show Sources')
            .setDesc('Show source information in chat responses')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showSources)
                .onChange(async (value) => {
                    this.plugin.settings.showSources = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Stream Responses')
            .setDesc('Stream AI responses as they are generated')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.streamResponses)
                .onChange(async (value) => {
                    this.plugin.settings.streamResponses = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        // Actions
        containerEl.createEl('h3', { text: 'Actions' });

        new Setting(containerEl)
            .setName('Sync External Data')
            .setDesc('Manually sync data from Notion and Airtable')
            .addButton(button => button
                .setButtonText('Sync Now')
                .setCta()
                .onClick(async () => {
                    button.setButtonText('Syncing...');
                    button.setDisabled(true);
                    try {
                        await this.plugin.dataIngestionManager.syncExternalData();
                        button.setButtonText('Sync Complete');
                        setTimeout(() => {
                            button.setButtonText('Sync Now');
                            button.setDisabled(false);
                        }, 2000);
                    } catch (error) {
                        console.error('Sync failed:', error);
                        button.setButtonText('Sync Failed');
                        setTimeout(() => {
                            button.setButtonText('Sync Now');
                            button.setDisabled(false);
                        }, 2000);
                    }
                }));

        new Setting(containerEl)
            .setName('Rebuild Embeddings')
            .setDesc('Rebuild all embeddings from scratch')
            .addButton(button => button
                .setButtonText('Rebuild')
                .setWarning()
                .onClick(async () => {
                    button.setButtonText('Rebuilding...');
                    button.setDisabled(true);
                    try {
                        await this.plugin.embeddingManager.rebuildEmbeddings();
                        button.setButtonText('Rebuild Complete');
                        setTimeout(() => {
                            button.setButtonText('Rebuild');
                            button.setDisabled(false);
                        }, 2000);
                    } catch (error) {
                        console.error('Rebuild failed:', error);
                        button.setButtonText('Rebuild Failed');
                        setTimeout(() => {
                            button.setButtonText('Rebuild');
                            button.setDisabled(false);
                        }, 2000);
                    }
                }));

        // Runtime Credentials (Notion)
        containerEl.createEl('h3', { text: 'Runtime Credentials' });
        new Setting(containerEl)
            .setName('Enable Runtime Credentials from Notion')
            .setDesc('Resolve provider API keys at runtime from your Notion secrets database')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.runtimeCredentialsEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.runtimeCredentialsEnabled = value;
                    await this.plugin.saveData(this.plugin.settings);
                    if (value) {
                        try { await this.plugin.credentialsResolver.warmup(true); } catch (e) { this.plugin.logger.debug('credentialsResolver warmup failed', e); }
                    }
                }));

        new Setting(containerEl)
            .setName('Notion Secrets Database ID')
            .setDesc('Database ID that contains Brand and API Key/Token columns')
            .addText(text => text
                .setPlaceholder('20e5e81a91ff813a914ecd71ce1edc9c')
                .setValue(this.plugin.settings.secretsNotionDatabaseId)
                .onChange(async (value) => {
                    this.plugin.settings.secretsNotionDatabaseId = value.trim();
                    await this.plugin.saveData(this.plugin.settings);
                }));
    }
}

