import * as React from 'react';
import { useState } from 'react';
import AIPlugin from "../../main";

interface SettingsPanelProps {
    plugin: AIPlugin;
    onClose: () => void;
    onSyncData: () => void;
    onRebuildEmbeddings: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    plugin,
    onClose,
    onSyncData,
    onRebuildEmbeddings
}) => {
    const [activeTab, setActiveTab] = useState('models');

    const handleModelChange = async (modelId: string) => {
        plugin.settings.selectedModel = modelId;
        await plugin.saveSettings();
    };

    const handleSettingChange = async (key: string, value: any) => {
        (plugin.settings as any)[key] = value;
        await plugin.saveSettings();
    };

    const renderModelsTab = () => (
        <div className="ai-plugin-settings-tab">
            <h3>AI Models</h3>
            
            <div className="ai-plugin-setting-group">
                <label>Selected Model:</label>
                <select
                    value={plugin.settings.selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                >
                    <optgroup label="OpenAI">
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </optgroup>
                    <optgroup label="Anthropic">
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                        <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    </optgroup>
                    <optgroup label="Google">
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    </optgroup>
                </select>
            </div>

            <div className="ai-plugin-setting-group">
                <label>OpenAI API Key:</label>
                <input
                    type="password"
                    value={plugin.settings.openaiApiKey}
                    onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)}
                    placeholder="sk-..."
                />
            </div>

            <div className="ai-plugin-setting-group">
                <label>Anthropic API Key:</label>
                <input
                    type="password"
                    value={plugin.settings.anthropicApiKey}
                    onChange={(e) => handleSettingChange('anthropicApiKey', e.target.value)}
                    placeholder="sk-ant-..."
                />
            </div>

            <div className="ai-plugin-setting-group">
                <label>Google AI API Key:</label>
                <input
                    type="password"
                    value={plugin.settings.googleApiKey}
                    onChange={(e) => handleSettingChange('googleApiKey', e.target.value)}
                    placeholder="AI..."
                />
            </div>
        </div>
    );

    const renderRAGTab = () => (
        <div className="ai-plugin-settings-tab">
            <h3>RAG & Embedding Settings</h3>
            
            <div className="ai-plugin-setting-group">
                <label>Embedding Model:</label>
                <select
                    value={plugin.settings.embeddingModel}
                    onChange={(e) => handleSettingChange('embeddingModel', e.target.value)}
                >
                    <option value="sentence-transformers/all-MiniLM-L6-v2">
                        all-MiniLM-L6-v2 (384d, 22MB)
                    </option>
                    <option value="sentence-transformers/all-mpnet-base-v2">
                        all-mpnet-base-v2 (768d, 420MB)
                    </option>
                </select>
            </div>

            <div className="ai-plugin-setting-group">
                <label>Chunk Size:</label>
                <input
                    type="number"
                    value={plugin.settings.chunkSize}
                    onChange={(e) => handleSettingChange('chunkSize', parseInt(e.target.value))}
                    min="100"
                    max="2000"
                />
            </div>

            <div className="ai-plugin-setting-group">
                <label>Chunk Overlap:</label>
                <input
                    type="number"
                    value={plugin.settings.chunkOverlap}
                    onChange={(e) => handleSettingChange('chunkOverlap', parseInt(e.target.value))}
                    min="0"
                    max="500"
                />
            </div>

            <div className="ai-plugin-setting-group">
                <label>Max Retrieved Chunks:</label>
                <input
                    type="number"
                    value={plugin.settings.maxRetrievedChunks}
                    onChange={(e) => handleSettingChange('maxRetrievedChunks', parseInt(e.target.value))}
                    min="1"
                    max="20"
                />
            </div>

            <div className="ai-plugin-setting-group">
                <label>Similarity Threshold:</label>
                <input
                    type="range"
                    value={plugin.settings.similarityThreshold}
                    onChange={(e) => handleSettingChange('similarityThreshold', parseFloat(e.target.value))}
                    min="0.1"
                    max="1.0"
                    step="0.1"
                />
                <span>{plugin.settings.similarityThreshold}</span>
            </div>

            <div className="ai-plugin-actions">
                <button onClick={onRebuildEmbeddings}>
                    🔄 Rebuild Embeddings
                </button>
            </div>
        </div>
    );

    const renderIntegrationsTab = () => (
        <div className="ai-plugin-settings-tab">
            <h3>External Integrations</h3>
            
            <div className="ai-plugin-setting-group">
                <label>Notion Integration Token:</label>
                <input
                    type="password"
                    value={plugin.settings.notionIntegrationToken}
                    onChange={(e) => handleSettingChange('notionIntegrationToken', e.target.value)}
                    placeholder="secret_..."
                />
            </div>

            <div className="ai-plugin-setting-group">
                <label>Notion Database IDs (one per line):</label>
                <textarea
                    value={plugin.settings.notionDatabaseIds.join('\n')}
                    onChange={(e) => handleSettingChange('notionDatabaseIds', e.target.value.split('\n').filter(id => id.trim()))}
                    placeholder="database-id-1&#10;database-id-2"
                    rows={3}
                />
            </div>

            <div className="ai-plugin-setting-group">
                <label>Airtable API Key:</label>
                <input
                    type="password"
                    value={plugin.settings.airtableApiKey}
                    onChange={(e) => handleSettingChange('airtableApiKey', e.target.value)}
                    placeholder="pat..."
                />
            </div>

            <div className="ai-plugin-setting-group">
                <label>Airtable Base IDs (one per line):</label>
                <textarea
                    value={plugin.settings.airtableBaseIds.join('\n')}
                    onChange={(e) => handleSettingChange('airtableBaseIds', e.target.value.split('\n').filter(id => id.trim()))}
                    placeholder="app..."
                    rows={3}
                />
            </div>

            <div className="ai-plugin-setting-group">
                <label>
                    <input
                        type="checkbox"
                        checked={plugin.settings.autoSync}
                        onChange={(e) => handleSettingChange('autoSync', e.target.checked)}
                    />
                    Enable Auto Sync
                </label>
            </div>

            <div className="ai-plugin-setting-group">
                <label>Sync Interval (minutes):</label>
                <input
                    type="number"
                    value={plugin.settings.syncInterval}
                    onChange={(e) => handleSettingChange('syncInterval', parseInt(e.target.value))}
                    min="5"
                    max="1440"
                />
            </div>

            <div className="ai-plugin-actions">
                <button onClick={onSyncData}>
                    🔄 Sync Now
                </button>
            </div>
        </div>
    );

    return (
        <div className="ai-plugin-settings-panel">
            <div className="ai-plugin-settings-header">
                <h2>Settings</h2>
                <button className="ai-plugin-close-button" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="ai-plugin-settings-tabs">
                <button
                    className={`ai-plugin-tab ${activeTab === 'models' ? 'active' : ''}`}
                    onClick={() => setActiveTab('models')}
                >
                    Models
                </button>
                <button
                    className={`ai-plugin-tab ${activeTab === 'rag' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rag')}
                >
                    RAG
                </button>
                <button
                    className={`ai-plugin-tab ${activeTab === 'integrations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('integrations')}
                >
                    Integrations
                </button>
            </div>

            <div className="ai-plugin-settings-content">
                {activeTab === 'models' && renderModelsTab()}
                {activeTab === 'rag' && renderRAGTab()}
                {activeTab === 'integrations' && renderIntegrationsTab()}
            </div>
        </div>
    );
};

