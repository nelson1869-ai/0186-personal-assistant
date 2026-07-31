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

Run the backend and browser UI together:

```bash
pnpm dev
```

Or run services separately:

```bash
pnpm api:dev
pnpm desktop:web
pnpm desktop:tauri
```

The API is available at `http://127.0.0.1:8000`, its OpenAPI docs at `/docs`, and the Vite UI at `http://localhost:1420`.

## Verification

```bash
pnpm test
pnpm build
```

## Automation

GitHub Actions runs tests, linting, strict type checks, and the web build for pushes and pull requests. To create a Windows desktop release, update the application versions, push a tag such as `v0.1.0`, then review and publish the draft created in GitHub Releases.

See [docs/architecture.md](docs/architecture.md) for the initial boundaries and [docs/development.md](docs/development.md) for platform notes and troubleshooting.
