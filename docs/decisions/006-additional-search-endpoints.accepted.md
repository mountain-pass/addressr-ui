---
status: "accepted"
date: 2026-04-16
accepted-date: 2026-04-24
decision-makers: [tom-howard]
consulted: [wr-architect:agent, wr-jtbd:agent]
informed: []
reassessment-date: 2026-07-16
---

# Additional Search Endpoints (Postcode, Locality, State)

## Context and Problem Statement

The addressr.io API has added three new search endpoints — postcode, locality, and state — alongside the existing address search. We need to expose these across all four packages (core + react/svelte/vue) so consumers can drop in a component for each narrower lookup (e.g. a postcode-only picker for a shipping form) without reinventing debounce, abort, pagination, ARIA, and keyboard navigation.

Doing this naively would either (a) duplicate the 15-line `searchAddresses` body four times in core and the ~180-line `useAddressSearch` body across react/svelte/vue, or (b) expose a single generic `search(rel, q)` that leaks rel strings into consumer code and forces consumers to union-type every result. Neither is acceptable.

## Decision Drivers

- Three new endpoints must be first-class across all four packages
- Consumers should import `searchPostcodes` / `usePostcodeSearch` / `PostcodeAutocomplete` — intent-revealing, no rel strings in consumer code
- Result types differ per endpoint; TypeScript inference must be clean
- Existing `searchAddresses` / `useAddressSearch` / `AddressAutocomplete` public APIs must remain backward compatible
- Code duplication across endpoints and frameworks should be minimised

## Considered Options

1. **Hybrid: generic internal primitive + concrete named public exports at each layer. No component-layer abstraction.**
2. **Fully generic everywhere** — one `search(rel, q)` in core, one `useSearch(rel, options)` per framework, one `Autocomplete rel={...}` component per framework
3. **Three fully separate implementations** — duplicate the body for each endpoint at every layer

## Decision Outcome

Chosen option: **"Hybrid"**, because it avoids 4× body duplication while keeping consumer-facing types clean and preserving backward compatibility for the existing address APIs.

### Layer application

**Core layer.** A private `searchByRel(rel, query, signal)` helper holds the shared body. Public exports stay concrete: `searchAddresses` (unchanged signature — now delegates to `searchByRel`), `searchPostcodes`, `searchLocalities`, `searchStates`. Result typing is per-endpoint: `PostcodeSearchResult`, `LocalitySearchResult`, `StateSearchResult`. `SearchPage` is generified to `SearchPage<T = AddressSearchResult>` with the default preserving backward compatibility for any existing consumer referencing the concrete type.

**Hook / store / composable layer.** React: internal `useSearch<T>(rel, options)` holds the shared debounce / abort / pagination logic. Public hooks `useAddressSearch` (unchanged signature — now delegates), `usePostcodeSearch`, `useLocalitySearch`, `useStateSearch` are thin wrappers pinning rel and result type. Svelte: `createSearch<T>` internal, four public named factories. Vue: `useSearch<T>` internal composable, four public named composables.

**Component layer — no abstraction.** Three new concrete components per framework — `PostcodeAutocomplete`, `LocalityAutocomplete`, `StateAutocomplete` — each a thin wrapper over its respective hook. Templating does not generify cleanly across three result-type shapes, and per-component label/placeholder/ARIA copy differs enough that abstraction would produce awkward defaults. Listbox/result-rendering primitives (skeleton loading, render-zone plumbing per ADR 004) are extracted to internal helpers per framework if they aren't already.

### Rel URIs

Rel URIs are discovered at runtime via HATEOAS. P1.1 (executed 2026-04-16) confirmed the live API advertises exactly the assumed values. Final values:

- Postcode: `https://addressr.io/rels/postcode-search`
- Locality: `https://addressr.io/rels/locality-search`
- State: `https://addressr.io/rels/state-search`

These live as named constants in `packages/core/src/api.ts` (`POSTCODE_SEARCH_REL`, `LOCALITY_SEARCH_REL`, `STATE_SEARCH_REL`) alongside the existing `SEARCH_REL`.

### Render customisation

New components honour the four render zones from ADR 004 with identical names (`renderItem` / `<slot name="item">`, `renderLoading`, `renderNoResults`, `renderError`). No new zones.

The default `renderItem` for postcode, locality, and state is plain text: the result types carry no `highlight` field, so there is no `<mark>` rendering and no highlight-segment parsing. This is a deliberate, narrower default than `AddressAutocomplete` where the API does return `highlight.sla` and `parseHighlight` is invoked. Consumers who want highlights for the narrower endpoints must supply `renderItem` themselves.

### Component-level styling

For React, all four components import the same `AddressAutocomplete.module.css`. For Svelte and Vue, the per-SFC scoped `<style>` block is duplicated verbatim across the four components. This is intentional: the project's STYLE-GUIDE.md mandates per-SFC scoped styles for Svelte/Vue. A shared stylesheet would require a guide amendment and is deferred. The duplicated rules consume identical `--addressr-*` tokens (per ADR 002), so a token change still propagates to every component without code edits.

### `onSelect` contract asymmetry

`AddressAutocomplete` triggers a follow-up HATEOAS `getAddressDetail` call after selection and emits the resulting `AddressDetail`. The three new components emit the `SearchResult` directly with no second request — postcode, locality, and state results carry every field the consumer needs (no detail resource exists upstream). This asymmetry is deliberate; it is documented in each component's prop/emit type and surfaces as a different `onSelect` payload type per component.

### CSS tokens

No new tokens. New components reuse the existing `--addressr-*` token system per ADR 002.

## Consequences

### Good

- Consumer-facing API communicates intent (`searchPostcodes`, not `search('postcode-search')`)
- TypeScript inference is clean per endpoint — no union result types
- Existing public APIs unchanged; `SearchPage<T>` default preserves backward compatibility
- Internal generic primitive keeps the shared body in one place (debounce, abort, pagination, retry)
- Consistent render-zone names across old and new components per ADR 004

### Neutral

- Three new components per framework = 9 new components in total. Each inherits the ADR 004 render-zone contract; per-component copy and ARIA differs deliberately
- `SearchPage` becomes generic — a type-level change, invisible at runtime
- Internal `useSearch` / `createSearch` primitives are a new private API surface. Not exported; only the concrete hooks/stores use them

### Bad

- Delegation refactor of `useAddressSearch` / `createAddressSearch` has regression risk (mitigated by existing test suites as a regression gate — see Confirmation)
- Rel URIs are a compatibility surface tied to the API contract; a server-side rel rename would force a new release
- No component-layer abstraction means future endpoint additions will require a new component file per framework. Acceptable at current scale (4 endpoints); reconsider at 8+

## Confirmation

1. Core exports `searchAddresses`, `searchPostcodes`, `searchLocalities`, `searchStates` from `packages/core/src/index.ts`. Verifiable by import.
2. Each framework package exports `{Address,Postcode,Locality,State}Autocomplete` and matching hook/store/composable. Verifiable by import.
3. `SearchPage` without a type argument resolves to `SearchPage<AddressSearchResult>`. Verifiable by tsc.
4. Rel URI constants in `api.ts` match the values recorded in this ADR. Verifiable by grep.
5. Existing `AddressAutocomplete` and `useAddressSearch` / `createAddressSearch` test suites pass unchanged after the delegation refactor. Regression gate.
6. New components expose the same four render zones (`renderItem`, `renderLoading`, `renderNoResults`, `renderError` or slot equivalents) per ADR 004. Verifiable by component test.

## Pros and Cons of the Options

### Option 1 — Hybrid (chosen)

- Good: consumer-facing types stay clean, no rel strings leak, minimal duplication
- Good: backward compatibility preserved at every public API
- Bad: two layers to maintain (internal primitive + public wrappers)

### Option 2 — Fully generic

- Good: smallest code surface
- Bad: leaks rel strings into consumer code
- Bad: union-typed results force consumer-side narrowing
- Bad: breaks existing `useAddressSearch` signature

### Option 3 — Three fully separate implementations

- Good: zero abstraction cost; each endpoint independently readable
- Bad: 4× duplication of the ~180-line debounce/abort/pagination body per framework
- Bad: future bug fixes must be applied in four places per framework

## Reassessment Criteria

- If a fourth or fifth endpoint variant is added, reconsider whether component-layer abstraction becomes worthwhile
- If the internal `searchByRel` / `useSearch` primitives are needed externally (e.g., for custom rels), consider promoting them to public API
- If `SearchPage<T>` generification causes friction with consumers who typed the old concrete form, consider deprecation timing
- Revisit by 2026-07-16 (3 months).
