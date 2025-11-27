# Repository Guidelines

## Project Structure & Module Organization
- Turbo + pnpm monorepo (Node 18+, pnpm 10.x). Workspace settings live in `tsconfig.json`, `turbo.json`, `biome.jsonc`, and `pnpm-workspace.yaml`.
- Library: `packages/streamdown` (TypeScript/React, entry `index.tsx`, helpers in `lib/` and `hooks/`, tests in `__tests__`, builds to `dist/` via `tsup`).
- Example consumers: `apps/website` (Next.js docs), `apps/test` (Next.js playground), `apps/tsrouter-chat-test` (Vite/TanStack Router). App assets sit under each `app`/`src`/`public`.

## Build, Test, and Development Commands
- `pnpm install` to bootstrap. `pnpm build` runs all builds; `pnpm --filter @mixtint/streamdown build` targets the library.
- `pnpm dev --filter website|test|tsrouter-chat-test` starts a chosen frontend (Next on 3000/3001, Vite on 3002).
- `pnpm test` / `pnpm test:coverage` / `pnpm test:ui`; add `--filter @mixtint/streamdown` to scope to the package. `pnpm bench` / `pnpm bench:ui` for performance work.
- `pnpm check-types` for TS; `pnpm check` and `pnpm fix` run Biome/Ultracite lint + format. `pnpm changeset` when altering the published package.

## Coding Style & Naming Conventions
- TypeScript + ESM; prefer named exports. Components in PascalCase, hooks prefixed `use`, tests as `*.test.tsx|ts`.
- Biome enforces 2-space indent, trailing commas, and import sorting—run `pnpm check` before pushing.
- Keep `rehype-harden`, Mermaid sanitization, and streaming-safe parsing intact; avoid DOM tweaks without coverage.
- Utilities in `lib/` should stay pure and typed; place fixtures in `__tests__/__fixtures__`.

## Testing Guidelines
- Vitest + jsdom drive `packages/streamdown/__tests__`; mirror existing patterns and cover streaming vs static markdown paths.
- Favor behavioral assertions and edge cases (unterminated Markdown, math, mermaid). Use `pnpm test:coverage` to catch gaps on touched code.

## Commit & Pull Request Guidelines
- Commit subjects: concise, imperative; emoji optional but keep light. Body can note scope/links.
- Include a changeset for library-impacting changes. Run `pnpm build`, `pnpm test`, `pnpm check-types`, `pnpm check` before review.
- PRs should state intent, approach, and tests; link issues (`Fixes #123`) and attach UI screenshots/gifs when relevant.

## Security & Configuration Notes
- No secrets or `.env` files in git; apps read env vars at runtime.
- Keep deps aligned across the workspace; avoid downgrading React/Next/Vite. Preserve hardened remark/rehype settings to prevent XSS.
