import * as React from 'react';
import { useState } from 'react';
import { ChatMessage } from '../../modules/utils/types';

interface MessageBubbleProps {
    message: ChatMessage;
    showSources: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showSources }) => {
    const [showSourcesExpanded, setShowSourcesExpanded] = useState(false);

    const formatTimestamp = (timestamp: Date) => {
        return new Intl.DateTimeFormat('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(timestamp);
    };

    const renderContent = (content: string) => {
        // Simple markdown-like rendering
        return content
            .split('\n')
            .map((line, index) => {
                // Handle code blocks
                if (line.startsWith('```')) {
                    return <div key={index} className="ai-plugin-code-block">{line.slice(3)}</div>;
                }
                // Handle bold text
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Handle italic text
                line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
                // Handle inline code
                line = line.replace(/`(.*?)`/g, '<code>$1</code>');

                return (
                    <div key={index} dangerouslySetInnerHTML={{ __html: line || '<br>' }} />
                );
            });
    };

    return (
        <div className={`ai-plugin-message ai-plugin-message-${message.role}`}>
            <div className="ai-plugin-message-header">
                <span className="ai-plugin-message-role">
                    {message.role === 'user' ? '👤' : '🤖'}
                </span>
                <span className="ai-plugin-message-timestamp">
                    {formatTimestamp(message.timestamp)}
                </span>
            </div>

            <div className="ai-plugin-message-content">
                {renderContent(message.content)}
            </div>

            {showSources && message.sources && message.sources.length > 0 && (
                <div className="ai-plugin-message-sources">
                    <button
                        className="ai-plugin-sources-toggle"
                        onClick={() => setShowSourcesExpanded(!showSourcesExpanded)}
                    >
                        📚 {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
                        <span className={`ai-plugin-chevron ${showSourcesExpanded ? 'expanded' : ''}`}>
                            ▼
                        </span>
                    </button>

                    {showSourcesExpanded && (
                        <div className="ai-plugin-sources-list">
                            {message.sources.map((source, _index) => (
                                <div key={source.id} className="ai-plugin-source-item">
                                    <div className="ai-plugin-source-header">
                                        <span className="ai-plugin-source-title">
                                            {source.title}
                                        </span>
                                        <span className="ai-plugin-source-type">
                                            {source.sourceType}
                                        </span>
                                        <span className="ai-plugin-source-similarity">
                                            {Math.round(source.similarity * 100)}%
                                        </span>
                                    </div>
                                    <div className="ai-plugin-source-content">
                                        {source.content.length > 200
                                            ? source.content.substring(0, 200) + '...'
                                            : source.content
                                        }
                                    </div>
                                    {source.path && (
                                        <div className="ai-plugin-source-path">
                                            📁 {source.path}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

