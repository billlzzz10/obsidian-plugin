import * as React from 'react';

interface StatusBarProps {
    vectorStoreStats: {
        totalVectors: number;
        obsidianVectors: number;
        notionVectors: number;
        airtableVectors: number;
    };
    isLoading: boolean;
    selectedModel: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    vectorStoreStats,
    isLoading,
    selectedModel
}) => {
    return (
        <div className="ai-plugin-status-bar">
            <div className="ai-plugin-status-item">
                <span className="ai-plugin-status-label">Model:</span>
                <span className="ai-plugin-status-value">{selectedModel}</span>
            </div>

            <div className="ai-plugin-status-item">
                <span className="ai-plugin-status-label">Vectors:</span>
                <span className="ai-plugin-status-value">
                    {vectorStoreStats.totalVectors}
                </span>
            </div>

            <div className="ai-plugin-status-item">
                <span className="ai-plugin-status-label">Sources:</span>
                <span className="ai-plugin-status-value">
                    📝 {vectorStoreStats.obsidianVectors} |
                    📄 {vectorStoreStats.notionVectors} |
                    📊 {vectorStoreStats.airtableVectors}
                </span>
            </div>

            {isLoading && (
                <div className="ai-plugin-status-item">
                    <span className="ai-plugin-status-loading">
                        <div className="ai-plugin-spinner-small"></div>
                        Processing...
                    </span>
                </div>
            )}
        </div>
    );
};

