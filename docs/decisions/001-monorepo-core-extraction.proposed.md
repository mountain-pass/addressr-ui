---
status: "proposed"
date: 2026-04-09
decision-makers: [Tom Howard, Claude Code]
consulted: []
informed: []
---

# Extract framework-agnostic core into monorepo

## Context and Problem Statement

Users are requesting address autocomplete components for Svelte, Vue, and other frameworks. The current single-package structure bundles framework-agnostic logic (API client, types, highlight parser) with React-specific code (hooks, components). This prevents other frameworks from reusing the HATEOAS client, pagination, and type definitions.

## Decision Drivers

- Multiple framework requests from users
- Clean separation already exists conceptually (API client vs React UI)
- Minimize duplicated HATEOAS/pagination logic across framework wrappers
- Maintain backwards compatibility for existing `@mountainpass/addressr-react` consumers

## Considered Options

1. **Monorepo with core extraction** (pnpm workspaces + turborepo)
2. **Separate repos** for core and each framework package
3. **Single package with subpath exports** (`@mountainpass/addressr-react/core`)

## Decision Outcome

Chosen option: **1 — Monorepo with core extraction**, because it keeps related code co-located, enables atomic cross-package changes, and simplifies CI/release.

### Package structure

- `@mountainpass/addressr-core` — API client, types, parseHighlight (zero framework deps)
- `@mountainpass/addressr-react` — Hook + component, depends on core, re-exports core for convenience

Future framework packages (Svelte, Vue) will be thin wrappers around core.

## Consequences

### Good

- Any framework can `npm install @mountainpass/addressr-core` and build a thin wrapper
- React package re-exports core, so existing consumers don't need to change imports
- Shared test fixtures and types across packages
- Turborepo caches builds, tests run in parallel

### Neutral

- Requires pnpm (not npm) for workspace management
- Changesets configured with linked versioning between core and react

### Bad

- More config files to maintain (per-package tsconfig, vite.config, vitest.config)
- Contributors need to understand monorepo conventions

## Confirmation

- `pnpm turbo build` builds both packages (core first, react second)
- `pnpm turbo test` runs 33 tests (16 core + 17 react)
- `pnpm turbo lint` passes clean
- React package re-exports all core types

## Reassessment Criteria

- If a third framework package is added and the monorepo overhead feels heavy, consider Nx or a different orchestrator
- If core API surface stabilizes and changes are rare, consider publishing core as a standalone repo
