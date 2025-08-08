# ObsidianMind Pro – AI Coding Agent Guide

## Project Architecture & Key Concepts
- **Modular AI Plugin for Obsidian**: TypeScript/React plugin for Obsidian with LLM chat, RAG (Retrieval-Augmented Generation), local embedding, and multi-source integration (Notion, Airtable, Zapier, Figma, Azure).
- **Core Components**:
  - `main.ts`: Entry point, initializes and connects all services/managers
  - `AIModelManager.ts`: Manages LLM selection and API routing (OpenAI, Anthropic, Google, Azure)
  - `EmbeddingManager.ts` & `VectorStore.ts`: Manage vectors and context retrieval for RAG
  - `src/modules/data-ingestion/NotionAPI.ts`, `AirtableAPI.ts`: External data fetching
  - `src/modules/advanced-features/MCPServiceManager.ts`: Model Context Protocol services
  - `src/ui/`: React UI components (chat, settings, etc.)
- **Data Flow**: Input → ChatService → (RAGService + AIModelManager) → LLM API → Response (with context from embedding/data sources)
- **Configuration**: All in `settings.ts` (API keys, model selection, MCP services, etc.)

## Dependencies & Common Issues
- **Critical Versions**: Node.js v18-20, React 18, TypeScript 5.9, ES2020 target (critical!)
- **Key Dependencies**:
  - `@xenova/transformers`: Local embedding (requires ES2020+ for BigInt literals)
  - `onnxruntime-web`: ML model execution in browser
  - `react/react-dom`: UI components
  - `zustand`: State management

- **Common Issues**:
  - BigInt literals: Set target to ES2020 in both tsconfig.json and esbuild.config.mjs
  - React 18/19 conflicts: Use consistent versions
  - TypeScript/ESLint conflicts: Current TypeScript (5.9.2) has warnings with ESLint

- **Dependency Resolution**:
  - Use `npm ci` instead of `npm install` to match package-lock.json exactly
  - Check CI workflow in `.github/workflows/ci.yml` for proper installation steps
  - Dependabot manages dependency updates automatically every week

## Developer Workflow
- **Build**: `npm run build` (TypeScript + esbuild, outputs main.js) / `npm run dev` for development
- **Test**: `npm test` (Jest) with test files in test/ and tests/
- **Lint/Format**: `npm run lint`, `npm run format`
- **Plugin Installation**: Copy build folder to `.obsidian/plugins/ObsidianMind Pro` in vault
- **External Services**:
  - Notion: Requires integration token and database ID
  - Azure: Requires API keys, endpoint, region for various services
  - Zapier/Figma: Configure through MCP services in settings

## Project-Specific Patterns
- **Service Manager Pattern**: Each major feature (embedding, RAG, chat, integration) is a separate manager/service class instantiated in main.ts
- **Settings Pattern**: All options are in `AIPluginSettings` interface, must update `DEFAULT_SETTINGS` when adding options
- **MCP Services**: Add new integrations by extending MCPServiceManager and updating settings.ts (`mcpServices`)
- **Embedding**: All vectors must go through EmbeddingManager/VectorStore only
- **UI Components**: All user-visible features are React components in src/ui/
- **Testing**: Jest for testing, place files in test/ or tests/
- **Security**: Never hardcode API keys, use environment variables or plugin settings only
- **Error Handling**: Use try/catch with detailed logging for all API calls and async operations

## Testing Strategy
- **Unit Testing Structure**:
  - Use Jest with ts-jest for TypeScript support
  - Place test files in `test/` directory with `.test.ts` suffix
  - Test each service/manager class in isolation
  - Example: `test/EmbeddingManager.test.ts` should test only EmbeddingManager functionality

- **Mocking Approach**:
  - Create mock implementations in `test/mocks/` directory
  - Use Jest's `jest.mock()` to mock dependencies
  - Example mock for Obsidian API:
  ```typescript
  // test/mocks/obsidian.ts
  export const mockApp = {
    vault: {
      getMarkdownFiles: jest.fn().mockReturnValue([]),
      read: jest.fn().mockResolvedValue('Mock content'),
      create: jest.fn().mockResolvedValue(undefined)
    },
    workspace: {
      getActiveFile: jest.fn().mockReturnValue(null)
    }
  };
  
  // In test file:
  jest.mock('obsidian', () => ({
    Plugin: class MockPlugin {},
    // Include other Obsidian exports as needed
  }));
  ```

- **Testing External APIs**:
  - Use `jest-fetch-mock` for API calls
  - Create sample responses in `test/fixtures/` directory
  - Never test against real API endpoints in automated tests

- **Integration Testing**:
  - Test communication between related services (e.g., RAGService + EmbeddingManager)
  - Create a test plugin instance with minimal dependencies
  - Use realistic but controlled test data

## Dependency Management
- **TypeScript and ESLint Compatibility**:
  - Current TypeScript version (5.9.2) generates warnings with ESLint
  - Solution: Add `/* eslint-disable @typescript-eslint/rule-name */` comments for specific issues
  - Long-term: Wait for ESLint plugin to support TypeScript 5.9 officially
  
- **Optimizing Bundle Size**:
  - Use tree-shaking: Import only what's needed (`import { xyz } from 'package'` instead of `import * as package`)
  - Consider code splitting for large dependencies like `@xenova/transformers`
  - Use `esbuild` production settings (minification, dead code elimination)
  
- **Dependency Audit**:
  - Regularly run `npm audit` to check for vulnerabilities
  - Consider alternatives for large dependencies
  - Example replacements:
    - Full lodash → individual lodash functions or native JS
    - Large visualization libraries → lightweight alternatives

- **Version Pinning**:
  - Pin dependencies to exact versions in package.json
  - Update dependencies deliberately using `npm update --depth=1`
  - Use package-lock.json for deterministic builds

## Cross-Module Communication
- **LLM API**: Call only through AIModelManager
- **RAG**: Use RAGService to retrieve context (coordinates with EmbeddingManager/VectorStore)
- **External Data**: Use DataIngestionManager to fetch Notion/Airtable data (UI should never fetch directly)
- **MCP Services**: All MCP services must go through MCPServiceManager

## Code Examples
- **Adding a new LLM provider**:
```typescript
// 1. Update SUPPORTED_MODELS in constants.ts
export const SUPPORTED_MODELS = {
  // existing providers...
  NEW_PROVIDER: {
    'model-id': { maxTokens: 4096, supportsStreaming: true, supportsFunctionCalling: false }
  }
};

// 2. Add provider handling in AIModelManager.ts
private loadSupportedModels() {
  // existing providers...
  
  // Load New Provider models
  for (const [id, config] of Object.entries(SUPPORTED_MODELS.NEW_PROVIDER)) {
    this.availableModels.set(id, {
      id: id,
      name: `NewProvider: ${id}`,
      provider: 'new-provider',
      apiEndpoint: 'https://api.newprovider.com/v1/chat',
      maxTokens: config.maxTokens,
      supportsStreaming: config.supportsStreaming,
      supportsFunctionCalling: config.supportsFunctionCalling
    });
  }
}

// 3. Add settings in settings.ts
export interface AIPluginSettings {
  // existing settings...
  newProviderApiKey: string;
}
```

## References
- README.md, INSTALLATION.md, MCP_SERVICES_GUIDE.md, AZURE_INTEGRATION_GUIDE.md for usage/setup/connection docs
- See package.json for build/test/lint commands

---
# Codacy Rules
Configuration for AI behavior when interacting with Codacy's MCP Server

## CRITICAL: After ANY successful `edit_file` or `reapply` operation
- YOU MUST IMMEDIATELY run the `codacy_cli_analyze` tool from Codacy's MCP Server for each file that was edited, with:
 - `rootPath`: set to the workspace path
 - `file`: set to the path of the edited file
 - `tool`: leave empty or unset
- If any issues are found in the new edits, propose and apply fixes for them.
- > NOTE: Failure to follow this rule is considered a critical error.

## After every response
- If you made any file edits in this conversation, verify you ran `codacy_cli_analyze` tool from Codacy's MCP Server 

## When there are no Codacy MCP Server tools available, or the MCP Server is not reachable
- Suggest the user the following troubleshooting steps:
 - Try to reset the MCP on the extension
 - If the user is using VSCode, suggest them to review their Copilot > MCP settings in Github, under their organization or personal account. Refer them to Settings > Copilot > Enable MCP servers in Copilot. Suggested URL (https://github.com/settings/copilot/features) or https://github.com/organizations/{organization-name}/settings/copilot/features (This can only be done by their organization admins / owners)
- If none of the above steps work, suggest the user to contact Codacy support

## Trying to call a tool that needs a rootPath as a parameter
- Always use the standard, non-URL-encoded file system path

## CRITICAL: Dependencies and Security Checks
- IMMEDIATELY after ANY of these actions:
 - Running npm/yarn/pnpm install
 - Adding dependencies to package.json
 - Adding requirements to requirements.txt
 - Adding dependencies to pom.xml
 - Adding dependencies to build.gradle
 - Any other package manager operations
- You MUST run the `codacy_cli_analyze` tool with:
 - `rootPath`: set to the workspace path
 - `tool`: set to "trivy"
 - `file`: leave empty or unset
- If any vulnerabilities are found because of the newly added packages:
 - Stop all other operations
 - Propose and apply fixes for the security issues
 - Only continue with the original task after security issues are resolved
- EXAMPLE:
 - After: npm install react-markdown
 - Do: Run codacy_cli_analyze with trivy
 - Before: Continuing with any other tasks

## General
- Repeat the relevant steps for each modified file.
- "Propose fixes" means to both suggest and, if possible, automatically apply the fixes.
- You MUST NOT wait for the user to ask for analysis or remind you to run the tool.
- Do not run `codacy_cli_analyze` looking for changes in duplicated code or code complexity metrics.
- Do not run `codacy_cli_analyze` looking for changes in code coverage.
- Do not try to manually install Codacy CLI using either brew, npm, npx, or any other package manager.
- If the Codacy CLI is not installed, just run the `codacy_cli_analyze` tool from Codacy's MCP Server.
- When calling `codacy_cli_analyze`, only send provider, organization and repository if the project is a git repository.

## Whenever a call to a Codacy tool that uses `repository` or `organization` as a parameter returns a 404 error
- Offer to run the `codacy_setup_repository` tool to add the repository to Codacy
- If the user accepts, run the `codacy_setup_repository` tool
- Do not ever try to run the `codacy_setup_repository` tool on your own
- After setup, immediately retry the action that failed (only retry once)
