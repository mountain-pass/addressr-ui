# Claude Code

Follow the instructions in [AGENTS.md](AGENTS.md).

Use the planning tool and AskQuestions too liberally.

Use test driven development. i.e. write the failing test first.

## Decision Management

Architectural and technical decisions must be documented per [DECISION-MANAGEMENT.md](DECISION-MANAGEMENT.md).

## Project Context

React address autocomplete component library for the Addressr Australian address API.

- **TypeScript** with strict mode
- **Vite** library mode for building (dual ESM/CJS output)
- **Vitest** + React Testing Library for tests
- **downshift** `useCombobox` for accessible combobox pattern (WAI-ARIA APG)
- **@windyroad/fetch-link** for HATEOAS link-following (RFC 8288)
- **CSS Modules** for scoped styles
- **Default branch: `main`**

### Exports

| Export | Purpose |
|--------|---------|
| `useAddressSearch` | Headless hook — debounce, abort, HATEOAS navigation, state |
| `AddressAutocomplete` | Drop-in styled component using downshift |
| `createAddressrClient` | Low-level HATEOAS API client |
| `parseHighlight` | Safe highlight parser (no dangerouslySetInnerHTML) |

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
