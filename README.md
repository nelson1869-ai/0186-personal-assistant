# 0186 Personal Assistant

Local-first personal assistant monorepo. Phase 1 provides a Tauri 2 desktop shell backed by React and TypeScript, plus a versioned FastAPI service.

## Prerequisites

- Node.js 20+ and pnpm 9+
- Python 3.12+ and uv
- Rust and the [Tauri system prerequisites](https://v2.tauri.app/start/prerequisites/) for desktop development

On Windows, run the API from WSL and the Tauri desktop app from PowerShell. The browser-only Vite workflow can run in either environment.

## Setup

```bash
cp .env.example .env
pnpm install
pnpm api:sync
```

## Development

Run the FastAPI backend and Vite desktop webview server together from WSL:

```bash
./scripts/start.sh
./scripts/status.sh
./scripts/stop.sh
```

The launcher works from any current directory, records project-owned process metadata under `.run/`, and stores service output in `.run/logs/`. Starting it again gracefully stops only the processes created by the previous launcher. It never broadly kills Node.js or Python processes and refuses to take over ports owned by unrelated processes.

Native Tauri execution and Windows installer testing must be run from PowerShell on Windows; `start.sh` intentionally starts only FastAPI and the Vite webview development server in WSL.

Or run services separately:

```bash
pnpm api:dev
pnpm desktop:web
pnpm desktop:tauri
```

The API is available at `http://127.0.0.1:8000`, its OpenAPI docs at `/docs`, and the Vite UI at `http://localhost:1420`.

## Phase 2 chat interface

The desktop webview now provides a responsive conversation shell with local mock history, simulated streaming responses, stop/retry/regenerate controls, keyboard submission, and light/dark themes. The backend indicator continues to use the FastAPI health endpoint, while assistant replies are isolated behind a typed frontend service that can be replaced by a real streaming API in a later phase.

The current conversations and assistant responses are intentionally in-memory only. Restarting the app resets them, and no prompt is sent to an AI provider.

## Verification

```bash
pnpm test
pnpm build
```

## Automation

GitHub Actions runs tests, linting, strict type checks, and the web build for pushes and pull requests. To create a Windows desktop release, update the application versions, push a tag such as `v0.1.0`, then review and publish the draft created in GitHub Releases.

See [docs/architecture.md](docs/architecture.md) for the initial boundaries and [docs/development.md](docs/development.md) for platform notes and troubleshooting.
