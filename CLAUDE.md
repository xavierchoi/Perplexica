# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format:write # Format code with Prettier
```

Database migrations are applied automatically on startup.

## Architecture Overview

Perplexica is a Next.js application that provides an AI-powered search engine with cited sources. It supports multiple LLM providers (Ollama, OpenAI, Anthropic, Gemini, Groq) and uses SearXNG as the search backend.

### Search Pipeline (`src/lib/agents/search/`)

The core search flow has three stages:

1. **Classification** (`classifier.ts`) - Analyzes the question to determine if research is needed, which widgets to show, and rewrites the query into a clearer form
2. **Research + Widgets** (run in parallel)
   - Research (`researcher/`) - Gathers information from web, academic sources, discussions, or uploaded files
   - Widgets (`widgets/`) - Structured helpers like weather, stocks, calculations
3. **Answer Generation** - Chat model writes the final response with citations

Research tools are registered in `researcher/actions/index.ts`. Available tools: webSearch, academicSearch, socialSearch, uploadsSearch, scrapeURL.

### Model System (`src/lib/models/`)

- **Providers** (`providers/`) - Each provider (openai, anthropic, ollama, gemini, groq, lmstudio, lemonade, transformers) implements LLM and/or embedding interfaces
- **Registry** (`registry.ts`) - Loads and manages available models from providers
- **Base classes** (`base/`) - Abstract interfaces for LLM and embedding models

To add a new provider: create a folder in `providers/`, implement the provider interface, and register it.

### API Routes (`src/app/api/`)

- `POST /api/chat` - Powers the chat UI (streaming)
- `POST /api/search` - Programmatic search endpoint (returns `message` and `sources`)
- `POST /api/images`, `POST /api/videos` - Media search endpoints
- `GET /api/providers` - Lists available providers and models
- `GET/POST /api/config` - Configuration management

### Key Directories

- `src/lib/prompts/` - All prompt templates for classification, research, and writing
- `src/lib/db/` - Database schema (Drizzle ORM with SQLite) and migrations
- `src/lib/uploads/` - File upload processing and semantic search
- `src/lib/searxng.ts` - SearXNG meta-search integration

### Optimization Modes

The `optimizationMode` parameter controls the speed/quality tradeoff:
- `speed` - Fast responses
- `balanced` - Default mode
- `quality` - Deep research

### Notes

- Settings > Models: 자동 저장 대신 명시적 Save 버튼 사용 (PR #6). ModelSelect는 controlled component.
