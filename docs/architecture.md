# Phase 1 architecture

The repository is a pnpm and uv monorepo with three active boundaries:

- `apps/desktop`: React owns presentation and connection state. Tauri supplies a restricted native shell with only its baseline capability.
- `apps/api`: FastAPI owns backend behavior and publishes versioned routes under `/api/v1`.
- `packages/api-client`: the shared TypeScript boundary for browser-to-API contracts and request behavior.

The desktop calls the API over loopback HTTP. Its API URL is configurable through `VITE_API_BASE_URL`. Development CORS origins are explicit and configurable through `ASSISTANT_CORS_ORIGINS`.

No AI provider, database, native command, or operating-system permission is introduced in this phase. Those capabilities will be added behind backend and permission boundaries when their behavior is defined and testable.

## Phase 2 frontend state

The chat UI is organized by application shell, conversations, and chat features. Typed conversation/message state lives in the chat controller, while response generation is accessed only through `AssistantService`. The current implementation supplies a local async-stream mock; a future FastAPI streaming adapter can implement the same contract without coupling transport behavior to React components.

Theme choice is local presentation state. Mock conversations are in-memory examples rather than persistence, and backend connectivity remains an independent health query through the shared API client.

## Health flow

1. The desktop starts and requests `GET /api/v1/health`.
2. FastAPI validates and serializes a `HealthResponse`.
3. The desktop displays connected or unavailable state and permits a manual retry.
