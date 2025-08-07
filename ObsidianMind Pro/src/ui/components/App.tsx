import * as React from 'react';
import { useState, useEffect } from 'react';
import { ChatInterface } from './ChatInterface';
import { SettingsPanel } from './SettingsPanel';
import { StatusBar } from './StatusBar';
import AIPlugin from '../../main';
import { ChatMessage } from '../../modules/utils/types';

interface AppProps {
    plugin: AIPlugin;
}

export const App: React.FC<AppProps> = ({ plugin }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [vectorStoreStats, setVectorStoreStats] = useState({
        totalVectors: 0,
        obsidianVectors: 0,
        notionVectors: 0,
        airtableVectors: 0
    });

    useEffect(() => {
        // Load chat history from plugin data
        loadChatHistory();
        // Load vector store stats
        loadVectorStoreStats();
    }, []);

    const loadChatHistory = async () => {
        try {
            const data = await plugin.loadData();
            if (data?.chatHistory) {
                setMessages(data.chatHistory);
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    };

    const saveChatHistory = async (newMessages: ChatMessage[]) => {
        try {
            const data = await plugin.loadData() || {};
            data.chatHistory = newMessages.slice(-plugin.settings.maxChatHistory);
            await plugin.saveData(data);
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    };

    const loadVectorStoreStats = async () => {
        try {
            const stats = await plugin.ragService.getVectorStoreStats();
            setVectorStoreStats(stats);
        } catch (error) {
            console.error('Failed to load vector store stats:', error);
        }
    };

    const handleSendMessage = async (content: string) => {
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: content,
            timestamp: new Date()
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Get AI response using RAG
            const response = await plugin.chatService.sendMessage(content);

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                timestamp: new Date(),
                sources: response.sources
            };

            const finalMessages = [...newMessages, assistantMessage];
            setMessages(finalMessages);
            await saveChatHistory(finalMessages);
        } catch (error) {
            console.error('Failed to get AI response:', error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error while processing your request. Please check your settings and try again.',
                timestamp: new Date()
            };
            const finalMessages = [...newMessages, errorMessage];
            setMessages(finalMessages);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = async () => {
        setMessages([]);
        await saveChatHistory([]);
    };

    const handleSyncData = async () => {
        setIsLoading(true);
        try {
            await plugin.dataIngestionManager.syncExternalData();
            await loadVectorStoreStats();
        } catch (error) {
            console.error('Failed to sync data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRebuildEmbeddings = async () => {
        setIsLoading(true);
        try {
            await plugin.embeddingManager.rebuildEmbeddings();
            await loadVectorStoreStats();
        } catch (error) {
            console.error('Failed to rebuild embeddings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-plugin-app">
            <div className="ai-plugin-header">
                <h2>AI Chat with RAG</h2>
                <div className="ai-plugin-header-buttons">
                    <button
                        className="ai-plugin-button"
                        onClick={() => setShowSettings(!showSettings)}
                        title="Toggle Settings"
                    >
                        ⚙️
                    </button>
                    <button
                        className="ai-plugin-button"
                        onClick={handleSyncData}
                        disabled={isLoading}
                        title="Sync External Data"
                    >
                        🔄
                    </button>
                    <button
                        className="ai-plugin-button"
                        onClick={handleClearChat}
                        title="Clear Chat"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {showSettings && (
                <SettingsPanel
                    plugin={plugin}
                    onClose={() => setShowSettings(false)}
                    onSyncData={handleSyncData}
                    onRebuildEmbeddings={handleRebuildEmbeddings}
                />
            )}

            <ChatInterface
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                showSources={plugin.settings.showSources}
            />

            <StatusBar
                vectorStoreStats={vectorStoreStats}
                isLoading={isLoading}
                selectedModel={plugin.settings.selectedModel}
            />
        </div>
    );
};

