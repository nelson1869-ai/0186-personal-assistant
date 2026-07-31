# AGENTS.md

## Project Identity

**Project name:** 0186 Personal Assistant
**Repository:** `https://github.com/nelson1869-ai/0186-personal-assistant`
**Local path:** `D:\Development\01869`
**WSL path:** `/mnt/d/Development/01869`

This project is a modern, local-first AI personal assistant for Windows. It will initially run on one PC and may later expand to web, mobile, cloud synchronization, and multi-user support.

The assistant must be able to communicate with AI models, retrieve information from approved local files, use controlled PC tools, maintain memory, execute approved workflows, and request explicit user approval before sensitive actions.

---

## Core Technology Stack

Use this stack unless a task explicitly requires otherwise:

### Desktop

* React
* TypeScript
* Vite
* Tauri 2
* Tailwind CSS
* shadcn/ui

### Backend

* Python
* FastAPI
* LangGraph
* LangChain components only where useful
* Pydantic
* SQLAlchemy
* Alembic

### Data

Initial development:

* SQLite

Future production:

* PostgreSQL
* pgvector
* Redis

### AI

* OpenAI
* Anthropic
* Google Gemini
* Ollama
* Provider abstraction must prevent vendor lock-in

### Integrations

* Model Context Protocol
* n8n
* WebSockets or Server-Sent Events
* Windows-native tools
* Postman for API testing only

### Tooling

* pnpm for JavaScript dependencies
* uv for Python dependency management
* Git
* GitHub
* PowerShell for Windows and Tauri tasks
* WSL for Python backend development

---

## Target Repository Structure

```text
01869/
├── apps/
│   ├── desktop/
│   └── api/
├── packages/
│   ├── api-client/
│   ├── shared-types/
│   └── shared-ui/
├── infrastructure/
│   ├── mcp/
│   ├── n8n/
│   ├── database/
│   └── monitoring/
├── docs/
├── scripts/
├── postman/
├── tests/
├── .env.example
├── .gitignore
├── AGENTS.md
├── README.md
├── SECURITY.md
├── pnpm-workspace.yaml
└── package.json
```

Do not create every future folder immediately. Create folders only when they contain real implementation files or required documentation.

---

## Architecture Principles

### 1. Local-first

The first version must work on the user's Windows PC.

The assistant should continue to provide basic local functionality even when cloud services are unavailable.

Cloud AI providers must be optional where a local Ollama model can be used.

### 2. Clear frontend and backend separation

The desktop application is responsible for:

* User interface
* Chat display
* Settings
* Approval dialogs
* Notifications
* Voice controls
* Desktop state
* Tauri command invocation

The backend is responsible for:

* FastAPI endpoints
* LangGraph orchestration
* AI provider access
* RAG
* Memory
* Tool registration
* Permission policies
* Audit logging
* Workflow execution
* MCP clients
* n8n integration

Do not put AI orchestration, database access, API keys, or sensitive business logic in the React frontend.

### 3. Modular monorepo

Keep modules small and focused.

Prefer feature-based organization over large generic folders.

Shared contracts must be placed in reusable packages rather than duplicated between applications.

### 4. Provider independence

AI model calls must go through a provider interface or model router.

Do not tightly couple agent logic to one provider.

The system should support switching between OpenAI, Anthropic, Gemini, and Ollama through configuration.

### 5. Security by default

The assistant must never receive unrestricted operating-system access by default.

All native tools must be explicitly registered and assigned a risk level.

Sensitive actions must require approval.

Dangerous actions must remain blocked unless a future security design explicitly permits them.

---

## Permission Model

Every tool must declare a permission level.

Use these initial levels:

```text
READ_ONLY
OPEN_APPLICATION
WRITE_FILE
RUN_COMMAND
NETWORK_ACTION
DELETE_FILE
SYSTEM_CHANGE
BLOCKED
```

Examples:

```text
Read an approved file       -> READ_ONLY
Search an approved folder   -> READ_ONLY
Open VS Code                -> OPEN_APPLICATION
Create a note               -> WRITE_FILE
Run project tests           -> RUN_COMMAND
Send an email               -> NETWORK_ACTION
Delete a file               -> DELETE_FILE
Edit registry settings      -> SYSTEM_CHANGE
Disable antivirus           -> BLOCKED
Format a drive              -> BLOCKED
```

Rules:

1. Read-only operations may run automatically only inside user-approved paths.
2. File creation or modification must follow configured approval policies.
3. Shell commands require approval unless specifically allowlisted.
4. Destructive actions require strong, explicit confirmation.
5. Security disabling, credential theft, privilege escalation, drive formatting, and similarly dangerous operations must be blocked.
6. Every tool execution must create an audit record.
7. Never hide commands from the user before execution.
8. Never construct or run destructive shell commands without explicit authorization.

---

## LangGraph Design

LangGraph is the primary orchestration framework.

The graph should eventually support:

* Conversation state
* Task planning
* Tool selection
* Permission checking
* Human approval
* Tool execution
* Retry handling
* Checkpointing
* Recovery after interruption
* Multi-agent routing

Suggested flow:

```text
User Request
    ↓
Intent Analysis
    ↓
Planner
    ↓
Tool or Agent Selection
    ↓
Permission Check
    ├── Allowed
    ├── Approval Required
    └── Blocked
    ↓
Execution
    ↓
Validation
    ↓
Memory and Audit Update
    ↓
Final Response
```

Do not create many agents prematurely.

Start with one primary assistant graph and add specialized agents only when their responsibilities are clearly different.

Possible future agents:

* File Agent
* Coding Agent
* Research Agent
* Calendar Agent
* Email Agent
* Reminder Agent
* System Control Agent

---

## RAG Requirements

RAG belongs in the backend.

The RAG system must support:

* Approved-folder indexing
* File type validation
* Text extraction
* Chunking
* Embedding generation
* Vector search
* Metadata filtering
* Source citations
* Incremental re-indexing
* File deletion handling
* Index status reporting

The assistant must not claim information came from a local file unless the retrieved source supports the answer.

Every RAG response should preserve:

* File path or document identifier
* Chunk identifier
* Relevant excerpt metadata
* Retrieval score where useful
* Index timestamp

Do not index arbitrary user folders without explicit approval.

Avoid storing secrets, credentials, private keys, or environment files in the vector store.

---

## MCP Requirements

MCP will be used as a standardized tool integration layer.

MCP servers and clients must be:

* Registered explicitly
* Configurable
* Permission-scoped
* Audited
* Disabled by default unless required
* Validated before use

Possible MCP integrations include:

* Filesystem
* GitHub
* PostgreSQL
* Calendar
* Email
* Browser tools
* Custom Windows tools

Do not trust an MCP server merely because it is connected.

Validate tool schemas, input arguments, output types, and permission requirements.

---

## n8n Requirements

n8n is an optional workflow automation layer.

Use n8n for:

* Scheduled workflows
* Multi-service integrations
* Notifications
* Email processing
* Recurring summaries
* External automation

Do not use n8n for core assistant reasoning.

LangGraph remains the main orchestration layer.

Store exported workflows under:

```text
infrastructure/n8n/workflows/
```

Never commit real n8n credentials, webhook secrets, or API keys.

---

## Desktop and Tauri Rules

Tauri provides the desktop shell and controlled native access.

Native commands must:

* Have narrow responsibilities
* Validate all arguments
* Reject unsafe paths
* Avoid arbitrary command execution
* Return typed errors
* Be covered by tests
* Follow Tauri capability restrictions

Do not expose a general-purpose shell execution command directly to the frontend.

Prefer dedicated commands such as:

```text
open_application
open_folder
read_approved_file
show_notification
get_system_information
copy_to_clipboard
```

Sensitive native actions must be routed through the backend permission system or an equivalent audited approval layer.

---

## API Standards

All backend routes should use versioned paths:

```text
/api/v1/
```

Initial endpoint groups may include:

```text
/api/v1/health
/api/v1/assistant
/api/v1/conversations
/api/v1/approvals
/api/v1/tools
/api/v1/files
/api/v1/rag
/api/v1/memory
/api/v1/integrations
/api/v1/settings
```

Requirements:

* Use Pydantic request and response models.
* Do not return raw database models.
* Use consistent error responses.
* Validate all user input.
* Stream assistant responses where appropriate.
* Keep route handlers thin.
* Put business logic in services.
* Add health and readiness endpoints.
* Generate and maintain OpenAPI documentation.

---

## Coding Standards

### Python

* Use modern type hints.
* Prefer async code for network and I/O operations.
* Use Pydantic settings for configuration.
* Use structured logging.
* Avoid broad exception handling.
* Do not suppress errors silently.
* Keep modules focused.
* Use dependency injection where practical.
* Add docstrings to public modules, classes, and complex functions.
* Follow Ruff formatting and linting.
* Use mypy or equivalent static type checking.

### TypeScript

* Enable strict mode.
* Avoid `any`.
* Use typed API contracts.
* Prefer small components.
* Keep state close to where it is used.
* Separate server state from local UI state.
* Validate external data.
* Avoid large all-purpose hooks and components.
* Use accessible semantic HTML.
* Handle loading, empty, success, and error states.

### Rust

* Use safe Rust.
* Avoid `unsafe` unless absolutely required and documented.
* Validate all frontend inputs.
* Return structured errors.
* Keep Tauri commands small.
* Do not expose unrestricted filesystem or shell access.

---

## Testing Requirements

Every meaningful feature must include appropriate tests.

Minimum test categories:

```text
Unit tests
Integration tests
API tests
Permission tests
Security tests
Desktop command tests
RAG retrieval tests
Agent graph tests
End-to-end tests
```

Important workflows to test:

* Health endpoint
* Frontend-to-backend communication
* Streaming responses
* Tool permission decisions
* Approval acceptance and rejection
* Blocked operations
* File path restrictions
* Provider switching
* RAG citations
* Agent retries
* Audit log creation

Do not claim a feature is complete without running relevant tests.

---

## Security Requirements

Never commit:

* API keys
* Access tokens
* Passwords
* Private keys
* Database credentials
* OAuth secrets
* n8n credentials
* Real `.env` files

Use `.env.example` with placeholders.

Security-sensitive requirements:

* Restrict CORS.
* Validate filesystem paths.
* Prevent directory traversal.
* Prevent command injection.
* Mask secrets in logs.
* Rate-limit exposed endpoints.
* Encrypt sensitive stored credentials.
* Add audit trails.
* Use least-privilege permissions.
* Require approval for external side effects.
* Never use unsafe default credentials.
* Never disable authentication merely to make tests pass.

---

## Git Workflow

Use small, focused commits.

Recommended commit prefixes:

```text
feat:
fix:
refactor:
test:
docs:
chore:
build:
ci:
perf:
security:
```

Examples:

```text
chore: initialize monorepo structure
feat: add FastAPI health endpoint
feat: add Tauri desktop shell
feat: connect desktop client to backend
security: add tool permission policy
test: add assistant API integration tests
```

Before committing:

1. Review `git diff`.
2. Remove generated files and secrets.
3. Run relevant tests.
4. Run linting and formatting.
5. Confirm documentation reflects the change.
6. Check `git status`.

Do not rewrite unrelated working code.

Do not perform broad refactors unless required by the task.

Do not force-push unless the user explicitly requests it.

---

## Development Environment

### Windows / PowerShell

Use for:

* React
* Tauri
* Rust
* Native Windows testing
* Packaging
* Installer generation

Project path:

```text
D:\Development\01869
```

### WSL

Use for:

* FastAPI
* LangGraph
* Python tooling
* Linux-based scripts
* Docker when added

Project path:

```text
/mnt/d/Development/01869
```

Be careful with:

* Windows versus Linux paths
* File permissions
* Line endings
* Port binding
* Environment variables
* Python virtual environments
* Node installations across Windows and WSL

Do not install the same project dependencies inconsistently across environments.

---

## Initial Build Phases

### Phase 1 — Foundation

* Initialize monorepo
* Add root configuration
* Create React + TypeScript + Tauri desktop app
* Create FastAPI backend
* Add health endpoint
* Connect desktop to backend
* Add development scripts
* Add baseline tests
* Add documentation

### Phase 2 — Chat UI

* Modern chat layout
* Conversation history
* Streaming responses
* Loading and error states
* Provider settings

### Phase 3 — First LangGraph Agent

* Assistant graph
* Typed graph state
* Model router
* Basic tool registry
* Checkpointing

### Phase 4 — Permissions and PC Tools

* Permission policies
* Approval interface
* Audit logging
* Safe application launching
* Approved-folder file reading
* Restricted command execution

### Phase 5 — Memory

* Conversation persistence
* User preferences
* Short-term memory
* Long-term memory
* Memory management UI

### Phase 6 — RAG

* File indexing
* Embeddings
* Vector search
* Retrieval
* Source citations
* Index management

### Phase 7 — MCP

* MCP registry
* Client connections
* Tool discovery
* Permission enforcement
* Audit integration

### Phase 8 — n8n

* Workflow triggers
* Webhook security
* Scheduled workflows
* Workflow history

### Phase 9 — Voice

* Speech input
* Streaming transcription
* Speech output
* Interruption support

### Phase 10 — Production

* Installer
* Auto-update strategy
* Observability
* Backups
* Performance testing
* Security review
* Release documentation

---

## Agent Operating Rules

When working on this project:

1. Inspect the current repository before making assumptions.
2. Read existing documentation and configuration.
3. Preserve working behavior.
4. Make the smallest correct change.
5. Do not create placeholder architecture without implementation value.
6. Do not invent successful test results.
7. Report commands actually run.
8. Report tests actually executed.
9. Clearly identify anything not tested.
10. Never expose secrets.
11. Never remove security controls to simplify development.
12. Do not add unnecessary dependencies.
13. Prefer maintained and stable packages.
14. Use current official APIs.
15. Keep the application runnable after each phase.
16. Update README and project documentation when architecture changes.
17. Add migrations for database schema changes.
18. Add tests for bug fixes.
19. Confirm frontend, backend, and desktop integration after significant changes.
20. Ask for explicit approval before destructive Git or filesystem actions.

---

## Task Completion Format

After completing a task, provide:

```text
Summary
- What was implemented

Files changed
- Important files created or modified

Validation
- Commands run
- Tests passed
- Tests not run

Risks or limitations
- Remaining concerns

Next recommended step
- One clear next action
```

Never claim “production-ready,” “fully secure,” or “complete” unless those claims are supported by testing and review.

---

## Current Project State

The repository is currently at the initial setup stage.

At the time this file is added, the project may contain only:

```text
README.md
AGENTS.md
```

Do not assume React, Tauri, FastAPI, LangGraph, RAG, MCP, n8n, databases, or infrastructure are already installed.

Inspect the repository before starting each task.
