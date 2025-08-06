import "obsidian";
import { EmbeddingManager } from "./modules/embedding/EmbeddingManager";
import { RAGService } from "./modules/rag/RAGService";
import { ChatService } from "./modules/chat/ChatService";
import { DataIngestionManager } from "./modules/data-ingestion/DataIngestionManager";
import { AIModelManager } from "./modules/ai-models/AIModelManager";
import { AdvancedFeaturesManager } from "./modules/advanced-features/AdvancedFeaturesManager";
import { AISetting } from "./settings";

declare module "obsidian" {
    interface App {
        plugins: {
            plugins: {
                "templater-obsidian"?: any; // For Templater plugin
            };
        };
    }

    interface Plugin {
        embeddingManager: EmbeddingManager;
        ragService: RAGService;
        chatService: ChatService;
        dataIngestionManager: DataIngestionManager;
        aiModelManager: AIModelManager;
        advancedFeaturesManager: AdvancedFeaturesManager;
        settings: AISetting;
        saveSettings: () => Promise<void>;
    }
}

