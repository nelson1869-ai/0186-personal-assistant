# Development guide

## Backend

From the repository root, install and run the API:

```bash
pnpm api:sync
pnpm api:dev
```

Test it directly with `curl http://127.0.0.1:8000/api/v1/health`.

## Desktop

`pnpm desktop:web` runs the React application in a browser. It is the quickest UI feedback loop and does not require Rust.

`pnpm desktop:tauri` runs the native shell. On Windows, execute this command from PowerShell after installing Rust, Microsoft C++ Build Tools, and WebView2 as described by Tauri.

The backend and native desktop do not need to run in the same shell. Keep the API bound to `127.0.0.1:8000` and start it in WSL; the Windows host can access that forwarded port in a standard WSL setup.

## Configuration

Copy `.env.example` to `.env`. Only values prefixed with `VITE_` are embedded into frontend code; never place secrets in such variables. Backend secrets and business logic belong in `apps/api`.

## Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run API and browser UI together |
| `pnpm test` | Run frontend and API tests |
| `pnpm lint` | Run ESLint and Ruff |
| `pnpm typecheck` | Run TypeScript and mypy |
| `pnpm build` | Produce the browser UI bundle |

## CI/CD

`.github/workflows/ci.yml` validates every pull request into `main` and pushes to `main` or `agent/**` branches. It installs dependencies from the committed lockfiles and runs the same test, lint, typecheck, and frontend build commands used locally.

`.github/workflows/release.yml` builds the Tauri application on Windows when a `v*` tag is pushed. It uploads the installer to a draft GitHub Release so binaries can be reviewed before publication. Before tagging, keep the version in `apps/desktop/package.json`, `apps/desktop/src-tauri/Cargo.toml`, and `apps/desktop/src-tauri/tauri.conf.json` aligned with the tag.
