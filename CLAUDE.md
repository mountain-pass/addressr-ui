# Claude Code

Follow the instructions in [AGENTS.md](AGENTS.md).

Use the planning tool and AskQuestions too liberally.

Use test driven development. i.e. write the failing test first.

## Decision Management

Architectural and technical decisions must be documented per [DECISION-MANAGEMENT.md](DECISION-MANAGEMENT.md).

## Project Context

UI component monorepo for the Addressr Australian address API.

- **Monorepo**: pnpm workspaces + turborepo
- **TypeScript** with strict mode
- **Vite** library mode for building (dual ESM/CJS output)
- **Vitest** + React Testing Library for tests
- **Default branch: `main`**

### Packages

| Package | npm | Purpose |
|---------|-----|---------|
| `packages/core` | `@mountainpass/addressr-core` | Framework-agnostic API client, types, parseHighlight |
| `packages/react` | `@mountainpass/addressr-react` | React hook + component (depends on core) |
| `packages/svelte` | `@mountainpass/addressr-svelte` | Svelte store + component (depends on core) |
| `packages/vue` | `@mountainpass/addressr-vue` | Vue composable + component (depends on core) |

### Core exports (`@mountainpass/addressr-core`)

| Export | Purpose |
|--------|---------|
| `createAddressrClient` | HATEOAS API client with pagination |
| `parseHighlight` | Safe highlight parser (no dangerouslySetInnerHTML) |
| Types | `AddressSearchResult`, `AddressDetail`, `SearchPage`, etc. |

### React exports (`@mountainpass/addressr-react`)

| Export | Purpose |
|--------|---------|
| `useAddressSearch` | Headless hook — debounce, abort, pagination, state |
| `AddressAutocomplete` | Drop-in styled component using downshift |
| Re-exports | Everything from `@mountainpass/addressr-core` |

### Svelte exports (`@mountainpass/addressr-svelte`)

| Export | Purpose |
|--------|---------|
| `createAddressSearch` | Svelte store — debounce, abort, pagination, state |
| `AddressAutocomplete` | Drop-in styled component with WAI-ARIA combobox |
| Re-exports | Everything from `@mountainpass/addressr-core` |

### Vue exports (`@mountainpass/addressr-vue`)

| Export | Purpose |
|--------|---------|
| `useAddressSearch` | Vue composable — debounce, abort, pagination, reactive refs |
| `AddressAutocomplete` | Drop-in styled SFC with WAI-ARIA combobox |
| Re-exports | Everything from `@mountainpass/addressr-core` |

### Accessibility (non-negotiable)

- WCAG AA compliance required for all components
- downshift handles ARIA roles, keyboard navigation, live regions
- Focus indicators: 3:1 contrast ratio minimum
- Touch targets: 44px minimum
- No `dangerouslySetInnerHTML` — highlights parsed safely via `parseHighlight`

## Non-Negotiable

- Never commit API keys or secrets
- Business metrics (revenue, user counts, pricing) are confidential
- All highlight rendering must use parseHighlight, never raw HTML injection
