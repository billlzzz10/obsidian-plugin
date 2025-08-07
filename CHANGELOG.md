# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive README with English and Thai documentation
- CI/CD pipeline with GitHub Actions
- Automated dependency updates with Dependabot
- ESLint and Prettier configuration
- Jest testing framework setup
- Contributing guidelines
- TypeScript build fixes and improvements

### Fixed
- TypeScript compilation errors
- Property initialization issues in classes
- API compatibility issues (AbortSignal.timeout polyfill)
- Missing type definitions and interfaces
- Build configuration issues

### Changed
- Improved project structure and organization
- Enhanced error handling with proper type casting
- Updated documentation structure

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Obsidian AI Plugin
- AI chat integration with multiple models (OpenAI, Anthropic, Google)
- RAG (Retrieval-Augmented Generation) functionality
- Local embedding processing with on-device models
- Multi-source data ingestion (Notion, Airtable)
- Vector search capabilities
- Templater plugin integration
- Custom tools and macro commands
- MCP (Model Context Protocol) support
- Azure Translator integration
- Advanced prompt management
- Real-time data synchronization
- Customizable settings interface

### Features
- **AI Models**: Support for GPT-4, Claude, Gemini models
- **Embeddings**: Local processing with sentence-transformers
- **Data Sources**: Obsidian notes, Notion databases, Airtable bases
- **Search**: Semantic search with configurable similarity thresholds
- **Tools**: Extensible tool system with JSON configuration
- **Automation**: Macro command processor for complex workflows
- **Privacy**: Local embedding processing for data privacy
- **Performance**: Optimized for mobile and desktop usage

[Unreleased]: https://github.com/billlzzz10/obsidian-plugin/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/billlzzz10/obsidian-plugin/releases/tag/v1.0.0