import * as React from 'react';
import { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    disabled: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message.trim());
            setMessage('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        if (textareaRef.current && !disabled) {
            textareaRef.current.focus();
        }
    }, [disabled]);

    return (
        <form className="ai-plugin-message-input-form" onSubmit={handleSubmit}>
            <div className="ai-plugin-message-input-container">
                <textarea
                    ref={textareaRef}
                    className="ai-plugin-message-input"
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={disabled ? 'AI is thinking...' : 'Ask me anything about your notes...'}
                    disabled={disabled}
                    rows={1}
                />
                <button
                    type="submit"
                    className="ai-plugin-send-button"
                    disabled={!message.trim() || disabled}
                    title="Send message (Enter)"
                >
                    {disabled ? (
                        <div className="ai-plugin-spinner"></div>
                    ) : (
                        '➤'
                    )}
                </button>
            </div>
            <div className="ai-plugin-input-hint">
                Press Enter to send, Shift+Enter for new line
            </div>
        </form>
    );
};

