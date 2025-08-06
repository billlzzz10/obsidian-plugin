# Test Plan for Obsidian AI Plugin

## 1. Introduction
This document outlines the test plan for the Obsidian AI Plugin, covering functional, performance, and integration testing.

## 2. Test Objectives
- Verify all core functionalities (RAG, Embedding, Chat) work as expected.
- Ensure seamless integration with Notion and Airtable.
- Confirm advanced features (Templater, Prompt Generation, MCP, Custom Tools) function correctly.
- Evaluate performance on both mobile and desktop environments.
- Identify and resolve bugs and performance bottlenecks.

## 3. Test Scope
- **Core Features:** RAG, Embedding, Chat Interface, AI Model Management.
- **Integrations:** Notion API, Airtable API, Data Sync.
- **Advanced Features:** Templater integration, Prompt Generator, Macro Command Processor, Custom Tool Management.
- **User Interface:** Responsiveness, usability, and visual consistency.
- **Performance:** Embedding generation speed, RAG query response time, overall plugin responsiveness.
- **Compatibility:** Obsidian desktop (Windows, macOS, Linux) and mobile (iOS, Android).

## 4. Test Environment
- **Operating Systems:** Windows 10/11, macOS (latest), Ubuntu (latest), iOS (latest), Android (latest).
- **Obsidian Versions:** Latest stable version.
- **Plugin Dependencies:** Templater (if installed).
- **External Services:** Notion, Airtable (with sample data).

## 5. Test Strategy
- **Unit Testing:** For individual modules (EmbeddingService, VectorStore, AIModelManager, etc.).
- **Integration Testing:** Verify interactions between modules and external services.
- **Functional Testing:** Test all features end-to-end from a user perspective.
- **Performance Testing:** Measure key metrics like response times and resource usage.
- **Compatibility Testing:** Test across different OS and device types.

## 6. Test Cases (Examples)

### 6.1. Embedding & RAG
- **TC-EMB-001:** Verify Obsidian notes are correctly embedded and retrievable.
- **TC-EMB-002:** Verify Notion pages are correctly embedded and retrievable.
- **TC-EMB-003:** Verify Airtable records are correctly embedded and retrievable.
- **TC-RAG-001:** Perform a RAG query and verify relevant sources are returned.
- **TC-RAG-002:** Test RAG with different similarity thresholds and max retrieved chunks.
- **TC-RAG-003:** Test rebuilding embeddings and verify vector store stats update.

### 6.2. Chat Interface
- **TC-CHAT-001:** Send a message and receive an AI response.
- **TC-CHAT-002:** Verify chat history is saved and loaded correctly.
- **TC-CHAT-003:** Test switching between different AI models.
- **TC-CHAT-004:** Verify streaming responses (if enabled).

### 6.3. Integrations (Notion & Airtable)
- **TC-NOTION-001:** Configure Notion integration and sync data.
- **TC-NOTION-002:** Verify Notion pages appear in RAG results.
- **TC-AIRTABLE-001:** Configure Airtable integration and sync data.
- **TC-AIRTABLE-002:** Verify Airtable records appear in RAG results.

### 6.4. Advanced Features
- **TC-TEMPLATER-001:** Use `ai_chat` function in Templater.
- **TC-TEMPLATER-002:** Use `ai_search` function in Templater.
- **TC-PROMPT-001:** Generate a prompt using a default template.
- **TC-PROMPT-002:** Add and use a custom prompt template.
- **TC-MCP-001:** Execute a simple macro command.
- **TC-MCP-002:** Execute a macro command with variable passing.
- **TC-TOOLS-001:** Add a custom tool via JSON.
- **TC-TOOLS-002:** Execute a built-in tool (e.g., `create_note`).

### 6.5. Performance
- **TC-PERF-001:** Measure time taken to embed 100 Obsidian notes.
- **TC-PERF-002:** Measure RAG query response time with 10,000 vectors.
- **TC-PERF-003:** Monitor CPU/RAM usage during heavy operations.

## 7. Test Tools
- Obsidian Developer Console for logging and debugging.
- Performance monitoring tools (e.g., browser developer tools, OS-level monitors).
- Sample Notion databases and Airtable bases.

## 8. Roles and Responsibilities
- **Agent:** Develop, test, and optimize the plugin.
- **User:** Provide feedback and perform user acceptance testing.

## 9. Exit Criteria
- All critical bugs resolved.
- All core functionalities verified.
- Performance meets acceptable thresholds.
- User feedback incorporated.
- Documentation complete.

