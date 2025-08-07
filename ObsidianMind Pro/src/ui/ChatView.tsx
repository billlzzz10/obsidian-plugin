import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { App } from './components/App';
import AIPlugin from '../main';

export const VIEW_TYPE_CHAT = 'ai-chat-view';

export class ChatView extends ItemView {
    private reactRoot!: ReactDOM.Root;
    private plugin: AIPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: AIPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_CHAT;
    }

    getDisplayText(): string {
        return 'AI Chat';
    }

    getIcon(): string {
        return 'bot';
    }

    async onOpen(): Promise<void> {
        this.reactRoot = ReactDOM.createRoot(this.containerEl.children[1]);
        this.reactRoot.render(
            <React.StrictMode>
                <App plugin={this.plugin} />
            </React.StrictMode>
        );
    }

    async onClose(): Promise<void> {
        this.reactRoot.unmount();
    }
}


