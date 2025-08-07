import * as React from 'react';
import { useRef, useEffect } from 'react';
import { ChatMessage } from '../../modules/utils/types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (content: string) => void;
    showSources: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    isLoading,
    onSendMessage,
    showSources
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="ai-plugin-chat-interface">
            <div className="ai-plugin-messages-container">
                {messages.length === 0 ? (
                    <div className="ai-plugin-empty-state">
                        <div className="ai-plugin-empty-icon">🤖</div>
                        <h3>Welcome to AI Chat with RAG</h3>
                        <p>
                            Ask me anything about your notes, Notion pages, or Airtable records.
                            I'll use your knowledge base to provide accurate answers.
                        </p>
                        <div className="ai-plugin-suggestions">
                            <button
                                className="ai-plugin-suggestion"
                                onClick={() => onSendMessage('What are the main topics in my notes?')}
                            >
                                What are the main topics in my notes?
                            </button>
                            <button
                                className="ai-plugin-suggestion"
                                onClick={() => onSendMessage('Summarize my recent work')}
                            >
                                Summarize my recent work
                            </button>
                            <button
                                className="ai-plugin-suggestion"
                                onClick={() => onSendMessage('Help me find information about...')}
                            >
                                Help me find information about...
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="ai-plugin-messages">
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                showSources={showSources}
                            />
                        ))}
                        {isLoading && (
                            <div className="ai-plugin-message ai-plugin-message-assistant">
                                <div className="ai-plugin-message-content">
                                    <div className="ai-plugin-typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <MessageInput
                onSendMessage={onSendMessage}
                disabled={isLoading}
            />
        </div>
    );
};

